import Peer from 'simple-peer'
import { socketService } from './socket'

class WebRTCService {
  constructor() {
    this.peer = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    this.atendimentoId = null
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onClose: null,
      onConnect: null
    }
  }

  // Verificar se o navegador suporta WebRTC
  verificarSuporteWebRTC() {
    const hasUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasRTCPeerConnection = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
    
    return {
      supported: hasUserMedia && hasRTCPeerConnection,
      userMedia: hasUserMedia,
      peerConnection: hasRTCPeerConnection
    }
  }

  // Inicializar mídia local (câmera e microfone)
  async inicializarMidia() {
    try {
      // Verificar suporte antes de tentar acessar mídia
      const suporte = this.verificarSuporteWebRTC()
      if (!suporte.supported) {
        throw new Error('Seu navegador não suporta videochamadas. Use Chrome, Firefox ou Safari.')
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream)
      }

      return this.localStream
    } catch (error) {
      console.error('Erro ao acessar mídia:', error)
      
      let mensagemErro = 'Erro ao acessar câmera/microfone'
      
      if (error.name === 'NotAllowedError') {
        mensagemErro = 'Permissão negada. Permita o acesso à câmera e microfone.'
      } else if (error.name === 'NotFoundError') {
        mensagemErro = 'Câmera ou microfone não encontrados.'
      } else if (error.name === 'NotSupportedError') {
        mensagemErro = 'Seu navegador não suporta videochamadas.'
      }
      
      if (this.callbacks.onError) {
        this.callbacks.onError(mensagemErro)
      }
      throw new Error(mensagemErro)
    }
  }

  // Criar peer (iniciador = médico, receptor = paciente)
  criarPeer(iniciador = false, atendimentoId) {
    this.isInitiator = iniciador
    this.atendimentoId = atendimentoId

    if (!this.localStream) {
      throw new Error('Stream local não disponível. Chame inicializarMidia() primeiro.')
    }

    this.peer = new Peer({
      initiator: iniciador,
      stream: this.localStream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    })

    // Quando gerar sinal (offer/answer)
    this.peer.on('signal', (data) => {
      console.log('📡 Enviando sinal:', data.type)
      socketService.emitirSinalWebRTC({
        atendimentoId: this.atendimentoId,
        signal: data,
        tipo: data.type
      })
    })

    // Quando receber stream remoto
    this.peer.on('stream', (stream) => {
      console.log('📹 Stream remoto recebido')
      this.remoteStream = stream
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream)
      }
    })

    // Quando conectar
    this.peer.on('connect', () => {
      console.log('🔗 Conexão P2P estabelecida')
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect()
      }
    })

    // Quando fechar
    this.peer.on('close', () => {
      console.log('❌ Conexão P2P fechada')
      this.limparConexao()
      if (this.callbacks.onClose) {
        this.callbacks.onClose()
      }
    })

    // Quando erro
    this.peer.on('error', (error) => {
      console.error('❌ Erro no peer:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError('Erro na conexão: ' + error.message)
      }
    })

    // Escutar sinais do WebSocket
    this.escutarSinais()
  }

  // Processar sinal recebido
  processarSinal(sinalData) {
    if (this.peer && sinalData.signal) {
      console.log('📨 Processando sinal:', sinalData.tipo)
      try {
        this.peer.signal(sinalData.signal)
      } catch (error) {
        console.error('❌ Erro ao processar sinal:', error)
        if (this.callbacks.onError) {
          this.callbacks.onError('Erro ao processar sinal de conexão')
        }
      }
    }
  }

  // Escutar sinais via WebSocket
  escutarSinais() {
    socketService.escutarSinalWebRTC((sinalData) => {
      if (sinalData.atendimentoId === this.atendimentoId) {
        this.processarSinal(sinalData)
      }
    })
  }

  // Alternar microfone
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

  // Alternar vídeo
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

  // Finalizar chamada
  finalizarChamada() {
    console.log('📞 Finalizando chamada...')
    this.limparConexao()
    if (this.atendimentoId) {
      socketService.emitirFinalizarChamada(this.atendimentoId)
    }
  }

  // Limpar conexão
  limparConexao() {
    console.log('🧹 Limpando conexão WebRTC...')
    
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('⏹️ Track parado:', track.kind)
      })
      this.localStream = null
    }

    this.remoteStream = null
    this.atendimentoId = null
    
    socketService.removerListener('sinal_webrtc')
  }

  // Definir callbacks
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  // Obter status da conexão
  obterStatusConexao() {
    if (!this.peer) return 'desconectado'
    
    switch (this.peer.connectionState || this.peer._pc?.connectionState) {
      case 'connected':
        return 'conectado'
      case 'connecting':
        return 'conectando'
      case 'disconnected':
        return 'desconectado'
      case 'failed':
        return 'falhou'
      default:
        return 'desconhecido'
    }
  }

  // Obter estatísticas da conexão
  async obterEstatisticas() {
    if (!this.peer || !this.peer._pc) return null

    try {
      const stats = await this.peer._pc.getStats()
      const result = {}
      
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          result.video = {
            bytesReceived: report.bytesReceived,
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost
          }
        }
      })
      
      return result
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return null
    }
  }
}

export const webrtcService = new WebRTCService()
