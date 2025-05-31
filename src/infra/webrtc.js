import Peer from 'simple-peer'
import { socketService } from './socket'

class WebRTCService {
  constructor() {
    this.peer = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    this.atendimentoId = null
    this.connectionTimeout = null
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onClose: null,
      onConnect: null,
      onProgress: null
    }
    
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { 
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      { 
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject', 
        credential: 'openrelayproject'
      },
      { 
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  }

  verificarSuporteWebRTC() {
    const hasUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasRTCPeerConnection = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
    
    return {
      supported: hasUserMedia && hasRTCPeerConnection,
      userMedia: hasUserMedia,
      peerConnection: hasRTCPeerConnection
    }
  }

  async testarConectividade() {
    try {
      this.reportarProgresso('Testando conectividade...')
      
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet')
      }

      const wsStatus = socketService.isConnected
      if (!wsStatus) {
        throw new Error('Conexão com servidor perdida')
      }

      await this.testarAcessoMidia()
      this.reportarProgresso('Conectividade OK')
      return true

    } catch (error) {
      console.error('❌ Teste de conectividade falhou:', error)
      throw error
    }
  }

  async testarAcessoMidia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()
      
      if (videoTracks.length === 0) {
        throw new Error('Nenhuma câmera disponível')
      }
      
      if (audioTracks.length === 0) {
        throw new Error('Nenhum microfone disponível')
      }

      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Permissão para câmera/microfone negada. Clique no ícone de cadeado e permita o acesso.')
      } else if (error.name === 'NotFoundError') {
        throw new Error('Câmera ou microfone não encontrados. Verifique se estão conectados.')
      }
      throw error
    }
  }

  async inicializarMidia() {
    try {
      this.reportarProgresso('Inicializando câmera e microfone...')

      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)

      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        console.log('📹 Vídeo configurado:', settings)
      }

      this.reportarProgresso('Mídia inicializada com sucesso')

      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream)
      }

      return this.localStream
    } catch (error) {
      console.error('❌ Erro ao inicializar mídia:', error)
      throw error
    }
  }

  async criarPeer(iniciador = false, atendimentoId) {
    this.isInitiator = iniciador
    this.atendimentoId = atendimentoId

    try {
      await this.testarConectividade()

      this.reportarProgresso(iniciador ? 'Iniciando conexão...' : 'Aguardando conexão...')

      this.connectionTimeout = setTimeout(() => {
        this.handleConnectionTimeout()
      }, 15000)

      const config = {
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all'
      }

      this.peer = new Peer({
        initiator: iniciador,
        stream: this.localStream,
        trickle: false,
        config: config,
        channelConfig: {},
        channelName: `channel-${atendimentoId}`
      })

      this.configurarEventosPeer()
      this.monitorarConexao()

    } catch (error) {
      console.error('❌ Erro ao criar peer:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError(error.message)
      }
    }
  }

  configurarEventosPeer() {
    this.peer.on('signal', (data) => {
      console.log('📡 Enviando sinal:', data.type)
      this.reportarProgresso(`Enviando ${data.type}...`)
      
      socketService.emitirSinalWebRTC({
        atendimentoId: this.atendimentoId,
        signal: data,
        tipo: data.type,
        timestamp: Date.now()
      })
    })

    this.peer.on('stream', (stream) => {
      console.log('📹 Stream remoto recebido')
      this.reportarProgresso('Vídeo conectado!')
      
      this.remoteStream = stream
      this.clearConnectionTimeout()
      
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream)
      }
    })

    this.peer.on('connect', () => {
      console.log('🔗 Conexão P2P estabelecida')
      this.reportarProgresso('Conectado com sucesso!')
      
      this.clearConnectionTimeout()
      
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect()
      }
    })

    this.peer.on('close', () => {
      console.log('❌ Conexão fechada')
      this.clearConnectionTimeout()
      this.limparConexao()
      if (this.callbacks.onClose) {
        this.callbacks.onClose()
      }
    })

    this.peer.on('error', (error) => {
      console.error('❌ Erro no peer:', error)
      this.clearConnectionTimeout()
      
      let mensagem = this.interpretarErro(error)
      
      if (this.callbacks.onError) {
        this.callbacks.onError(mensagem)
      }
    })

    this.escutarSinais()
  }

  monitorarConexao() {
    let checksConsecutivos = 0
    
    const interval = setInterval(() => {
      if (!this.peer || !this.peer._pc) {
        clearInterval(interval)
        return
      }

      const pc = this.peer._pc
      const connectionState = pc.connectionState
      const iceConnectionState = pc.iceConnectionState
      const iceGatheringState = pc.iceGatheringState

      console.log('📊 Estado detalhado:', {
        connection: connectionState,
        ice: iceConnectionState,
        gathering: iceGatheringState,
        signaling: pc.signalingState
      })

      if (iceConnectionState === 'failed' || connectionState === 'failed') {
        console.error('💥 Conexão falhou definitivamente')
        clearInterval(interval)
        this.handleConnectionFailure()
        return
      }

      if (iceConnectionState === 'disconnected') {
        checksConsecutivos++
        console.warn(`⚠️ Desconectado por ${checksConsecutivos} checks`)
        
        if (checksConsecutivos >= 3) {
          console.error('💥 Muitos checks de desconexão')
          clearInterval(interval)
          this.handleConnectionFailure()
          return
        }
      } else {
        checksConsecutivos = 0
      }

      if (connectionState === 'connected' && iceConnectionState === 'connected') {
        console.log('✅ Conexão totalmente estabelecida')
        clearInterval(interval)
      }

    }, 2000)
  }

  interpretarErro(error) {
    const errorMap = {
      'ERR_WEBRTC_SUPPORT': 'Navegador não suporta videochamadas',
      'ERR_CONNECTION_FAILURE': 'Falha na conexão - verifique internet',
      'ERR_SIGNALING': 'Erro de sinalização - servidor indisponível',
      'ERR_ICE_CONNECTION_FAILURE': 'Bloqueio de firewall detectado',
      'ERR_DATA_CHANNEL': 'Canal de dados falhou'
    }

    return errorMap[error.code] || `Erro de conexão: ${error.message}`
  }

  handleConnectionTimeout() {
    console.error('⏰ Timeout: Conexão não estabelecida em 15 segundos')
    
    const mensagem = 'Timeout de conexão. Verifique sua internet e tente novamente.'
    
    if (this.callbacks.onError) {
      this.callbacks.onError(mensagem)
    }
    
    this.limparConexao()
  }

  handleConnectionFailure() {
    console.error('💥 Falha total de conexão')
    
    const mensagem = 'Falha na conexão de vídeo. Isto pode ser devido a firewall restritivo ou problemas de rede.'
    
    if (this.callbacks.onError) {
      this.callbacks.onError(mensagem)
    }
  }

  processarSinal(sinalData) {
    if (!this.peer || !sinalData.signal) {
      console.warn('⚠️ Sinal recebido mas peer não disponível')
      return
    }

    console.log('📨 Processando sinal:', sinalData.tipo)
    this.reportarProgresso(`Processando ${sinalData.tipo}...`)
    
    try {
      this.peer.signal(sinalData.signal)
    } catch (error) {
      console.error('❌ Erro ao processar sinal:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError('Erro ao processar sinal: ' + error.message)
      }
    }
  }

  escutarSinais() {
    socketService.escutarSinalWebRTC((sinalData) => {
      if (sinalData.atendimentoId === this.atendimentoId) {
        this.processarSinal(sinalData)
      }
    })
  }

  async forcarReconexao() {
    console.log('🔄 Iniciando reconexão...')
    
    try {
      if (this.peer) {
        this.peer.destroy()
        this.peer = null
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
      await this.testarConectividade()
      await this.criarPeer(this.isInitiator, this.atendimentoId)

      console.log('✅ Reconexão iniciada')
      
    } catch (error) {
      console.error('❌ Falha na reconexão:', error)
      throw error
    }
  }

  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  reportarProgresso(mensagem) {
    console.log('📋', mensagem)
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(mensagem)
    }
  }

  alternarMicrofone() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        return audioTrack.enabled
      }
    }
    return false
  }

  alternarVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        return videoTrack.enabled
      }
    }
    return false
  }

  finalizarChamada() {
    console.log('📞 Finalizando chamada...')
    this.clearConnectionTimeout()
    this.limparConexao()
    if (this.atendimentoId) {
      socketService.emitirFinalizarChamada(this.atendimentoId)
    }
  }

  limparConexao() {
    console.log('🧹 Limpando conexão...')
    
    this.clearConnectionTimeout()
    
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    this.remoteStream = null
    this.atendimentoId = null
    
    socketService.removerListener('sinal_webrtc')
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  obterStatusConexao() {
    if (!this.peer) return 'desconectado'
    
    const connectionState = this.peer.connectionState || this.peer._pc?.connectionState
    const iceConnectionState = this.peer.iceConnectionState || this.peer._pc?.iceConnectionState
    
    if (connectionState === 'connected' || iceConnectionState === 'connected') {
      return 'conectado'
    } else if (connectionState === 'connecting' || iceConnectionState === 'connecting') {
      return 'conectando'
    } else if (connectionState === 'failed' || iceConnectionState === 'failed') {
      return 'falhou'
    }
    return 'desconectado'
  }

  obterDiagnosticoRapido() {
    return {
      online: navigator.onLine,
      peerExists: !!this.peer,
      peerConnected: this.peer?.connected,
      connectionState: this.peer?.connectionState || this.peer?._pc?.connectionState,
      iceConnectionState: this.peer?.iceConnectionState || this.peer?._pc?.iceConnectionState,
      localStream: !!this.localStream,
      remoteStream: !!this.remoteStream
    }
  }
}

export const webrtcService = new WebRTCService()
