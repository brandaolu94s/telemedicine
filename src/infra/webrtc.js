import { socketService } from './socket'

class WebRTCService {
  constructor() {
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    this.atendimentoId = null
    this.connectionTimeout = null
    this.iceCandidates = []
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onClose: null,
      onConnect: null,
      onProgress: null
    }
    
    // Configuração dos servidores ICE
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
    const hasRTCPeerConnection = !!(window.RTCPeerConnection)
    
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

      // Timeout para conexão
      this.connectionTimeout = setTimeout(() => {
        this.handleConnectionTimeout()
      }, 15000)

      // Configuração da conexão peer
      const config = {
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all'
      }

      this.peerConnection = new RTCPeerConnection(config)
      
      // Configurar eventos
      this.configurarEventosPeer()
      
      // Adicionar stream local
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream)
        })
      }

      // Se é iniciador, criar oferta
      if (iniciador) {
        await this.criarOferta()
      }

      // Escutar sinais do WebSocket
      this.escutarSinais()

    } catch (error) {
      console.error('❌ Erro ao criar peer:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError(error.message)
      }
    }
  }

  configurarEventosPeer() {
    // Receber ICE candidates
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        console.log('📡 Enviando ICE candidate')
        this.enviarSinal('ice-candidate', event.candidate)
      }
    })

    // Mudanças no estado da conexão ICE
    this.peerConnection.addEventListener('iceconnectionstatechange', () => {
      const state = this.peerConnection.iceConnectionState
      console.log('🧊 ICE Connection State:', state)
      
      switch (state) {
        case 'connected':
        case 'completed':
          this.clearConnectionTimeout()
          this.reportarProgresso('Conectado com sucesso!')
          if (this.callbacks.onConnect) {
            this.callbacks.onConnect()
          }
          break
        case 'failed':
          this.handleConnectionFailure()
          break
        case 'disconnected':
          this.reportarProgresso('Conexão perdida, tentando reconectar...')
          break
        case 'closed':
          this.limparConexao()
          if (this.callbacks.onClose) {
            this.callbacks.onClose()
          }
          break
      }
    })

    // Mudanças no estado da conexão geral
    this.peerConnection.addEventListener('connectionstatechange', () => {
      const state = this.peerConnection.connectionState
      console.log('🔗 Connection State:', state)
      
      if (state === 'failed') {
        this.handleConnectionFailure()
      }
    })

    // Receber stream remoto
    this.peerConnection.addEventListener('track', (event) => {
      console.log('📹 Stream remoto recebido')
      this.remoteStream = event.streams[0]
      this.reportarProgresso('Vídeo conectado!')
      
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream)
      }
    })
  }

  async criarOferta() {
    try {
      this.reportarProgresso('Criando oferta...')
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      
      await this.peerConnection.setLocalDescription(offer)
      this.enviarSinal('offer', offer)
      
    } catch (error) {
      console.error('❌ Erro ao criar oferta:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError('Erro ao criar oferta: ' + error.message)
      }
    }
  }

  async criarResposta(offer) {
    try {
      this.reportarProgresso('Processando oferta...')
      await this.peerConnection.setRemoteDescription(offer)
      
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      
      this.enviarSinal('answer', answer)
      
    } catch (error) {
      console.error('❌ Erro ao criar resposta:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError('Erro ao criar resposta: ' + error.message)
      }
    }
  }

  async processarResposta(answer) {
    try {
      this.reportarProgresso('Processando resposta...')
      await this.peerConnection.setRemoteDescription(answer)
      
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError('Erro ao processar resposta: ' + error.message)
      }
    }
  }

  async adicionarIceCandidate(candidate) {
    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(candidate)
      } else {
        // Guardar candidate para adicionar depois
        this.iceCandidates.push(candidate)
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar ICE candidate:', error)
    }
  }

  async processarCandidatesEnFileirados() {
    for (const candidate of this.iceCandidates) {
      try {
        await this.peerConnection.addIceCandidate(candidate)
      } catch (error) {
        console.error('❌ Erro ao adicionar candidate enfileirado:', error)
      }
    }
    this.iceCandidates = []
  }

  enviarSinal(tipo, dados) {
    socketService.emitirSinalWebRTC({
      atendimentoId: this.atendimentoId,
      signal: {
        type: tipo,
        data: dados
      },
      tipo: tipo,
      timestamp: Date.now()
    })
  }

  async processarSinal(sinalData) {
    if (!this.peerConnection || !sinalData.signal) {
      console.warn('⚠️ Sinal recebido mas peer não disponível')
      return
    }

    console.log('📨 Processando sinal:', sinalData.tipo)
    this.reportarProgresso(`Processando ${sinalData.tipo}...`)
    
    try {
      const { type, data } = sinalData.signal

      switch (type) {
        case 'offer':
          await this.criarResposta(data)
          await this.processarCandidatesEnFileirados()
          break
          
        case 'answer':
          await this.processarResposta(data)
          await this.processarCandidatesEnFileirados()
          break
          
        case 'ice-candidate':
          await this.adicionarIceCandidate(data)
          break
          
        default:
          console.warn('⚠️ Tipo de sinal desconhecido:', type)
      }
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
      if (this.peerConnection) {
        this.peerConnection.close()
        this.peerConnection = null
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
    
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    this.remoteStream = null
    this.atendimentoId = null
    this.iceCandidates = []
    
    socketService.removerListener('sinal_webrtc')
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  obterStatusConexao() {
    if (!this.peerConnection) return 'desconectado'
    
    const connectionState = this.peerConnection.connectionState
    const iceConnectionState = this.peerConnection.iceConnectionState
    
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
      peerExists: !!this.peerConnection,
      peerState: this.peerConnection?.connectionState,
      iceState: this.peerConnection?.iceConnectionState,
      localStream: !!this.localStream,
      remoteStream: !!this.remoteStream,
      isInitiator: this.isInitiator,
      atendimentoId: this.atendimentoId
    }
  }
}

export const webrtcService = new WebRTCService()
