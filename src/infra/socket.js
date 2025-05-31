import io from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(userId, userType) {
    if (this.socket?.connected) return

    this.socket = io('https://telemedicne-server.onrender.com', {
      query: { userId, userType },
      transports: ['websocket'],
      autoConnect: true
    })

    this.socket.on('connect', () => {
      console.log('Conectado ao WebSocket')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Desconectado do WebSocket')
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('Erro no WebSocket:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Eventos de Fila
  emitirNovoPacienteNaFila(dadosPaciente) {
    if (this.socket?.connected) {
      this.socket.emit('novo_paciente_na_fila', dadosPaciente)
    }
  }

  escutarNovoPacienteNaFila(callback) {
    if (this.socket) {
      this.socket.on('novo_paciente_na_fila', callback)
    }
  }

  // Eventos de Atendimento
  emitirAceitarPaciente(dadosAtendimento) {
    if (this.socket?.connected) {
      this.socket.emit('aceitar_paciente', dadosAtendimento)
    }
  }

  emitirRecusarPaciente(dadosRecusa) {
    if (this.socket?.connected) {
      this.socket.emit('recusar_paciente', dadosRecusa)
    }
  }

  escutarStatusAtendimento(callback) {
    if (this.socket) {
      this.socket.on('status_atendimento', callback)
    }
  }

  // Eventos WebRTC
  emitirSinalWebRTC(dadosSinal) {
    if (this.socket?.connected) {
      this.socket.emit('sinal_webrtc', dadosSinal)
    }
  }

  escutarSinalWebRTC(callback) {
    if (this.socket) {
      this.socket.on('sinal_webrtc', callback)
    }
  }

  emitirFinalizarChamada(atendimentoId) {
    if (this.socket?.connected) {
      this.socket.emit('finalizar_chamada', { atendimentoId })
    }
  }

  escutarFinalizarChamada(callback) {
    if (this.socket) {
      this.socket.on('finalizar_chamada', callback)
    }
  }

  // Remover listeners
  removerListener(evento) {
    if (this.socket) {
      this.socket.off(evento)
    }
  }

  removerTodosListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

export const socketService = new SocketService()
