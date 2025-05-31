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

  // Inicializar mídia local (câmera e microfone)
  async inicializarMidia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
      if (this.callbacks.onError) {
        this.callbacks.onError('Erro ao acessar câmera/microfone: ' + error.message)
      }
      throw error
    }
  }

  // Criar peer (iniciador = médico, receptor = paciente)
  criarPeer(iniciador = false, atendimentoId) {
    this.isInitiator = iniciador
    this.atendimentoId = atendimentoId

    this.peer = new Peer({
      initiator: iniciador,
      stream: this.localStream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    })

    // Quando gerar sinal (offer/answer)
    this.peer.on('signal', (data) => {
      console.log('Enviando sinal:', data.type)
      socketService.emitirSinalWebRTC({
        atendimentoId: this.atendimentoId,
        signal: data,
        tipo: data.type
      })
    })

    // Quando receber stream remoto
    this.peer.on('stream', (stream) => {
      console.log('Stream remoto recebido')
      this.remoteStream = stream
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream)
      }
    })

    // Quando conectar
    this.peer.on('connect', () => {
      console.log('Conexão P2P estabelecida')
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect()
      }
    })

    // Quando fechar
    this.peer.on('close', () => {
      console.log('Conexão P2P fechada')
      this.limparConexao()
      if (this.callbacks.onClose) {
        this.callbacks.onClose()
      }
    })

    // Quando erro
    this.peer.on('error', (error) => {
      console.error('Erro no peer:', error)
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
      console.log('Processando sinal:', sinalData.tipo)
      this.peer.signal(sinalData.signal)
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
    this.limparConexao()
    socketService.emitirFinalizarChamada(this.atendimentoId)
  }

  // Limpar conexão
  limparConexao() {
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

  // Definir callbacks
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
}

export const webrtcService = new WebRTCService()