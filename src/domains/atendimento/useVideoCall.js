import { useState, useEffect, useRef } from 'react'
import { webrtcService } from '../../infra/webrtc'
import { socketService } from '../../infra/socket'
import { finalizarAtendimento } from './atendimentoService'
import { useAuth } from '../auth/useAuth'

export const useVideoCall = (atendimentoId, isInitiator = false) => {
  const { usuario } = useAuth()
  const [chamadaAtiva, setChamadaAtiva] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [microfoneAtivo, setMicrofoneAtivo] = useState(true)
  const [videoAtivo, setVideoAtivo] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const iniciarChamada = async () => {
    if (!atendimentoId) {
      setErro('ID do atendimento não fornecido')
      return
    }

    try {
      setCarregando(true)
      setErro(null)

      console.log('🚀 Iniciando chamada...', { atendimentoId, isInitiator })

      // Verificar suporte ao WebRTC
      const suporte = webrtcService.verificarSuporteWebRTC()
      if (!suporte.supported) {
        throw new Error('Seu navegador não suporta videochamadas. Use Chrome, Firefox ou Safari.')
      }

      // Configurar callbacks
      webrtcService.setCallbacks({
        onLocalStream: (stream) => {
          console.log('📹 Stream local recebido')
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        },
        onRemoteStream: (stream) => {
          console.log('📺 Stream remoto recebido')
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
          }
        },
        onConnect: () => {
          console.log('✅ Conectado!')
          setConectado(true)
          setCarregando(false)
        },
        onError: (errorMsg) => {
          console.error('❌ Erro WebRTC:', errorMsg)
          setErro(errorMsg)
          setCarregando(false)
        },
        onClose: () => {
          console.log('📞 Chamada finalizada')
          finalizarChamadaLocal()
        }
      })

      // Inicializar mídia primeiro
      await webrtcService.inicializarMidia()
      console.log('🎥 Mídia inicializada')
      
      // Criar peer
      webrtcService.criarPeer(isInitiator, atendimentoId)
      console.log('🔗 Peer criado')
      
      setChamadaAtiva(true)
      
      // Escutar finalização de chamada via WebSocket
      socketService.escutarFinalizarChamada((dados) => {
        if (dados.atendimentoId === atendimentoId) {
          console.log('📞 Chamada finalizada remotamente')
          finalizarChamadaLocal()
        }
      })

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      setErro(error.message)
      setCarregando(false)
    }
  }

  const alternarMicrofone = () => {
    try {
      const novoEstado = webrtcService.alternarMicrofone()
      setMicrofoneAtivo(novoEstado)
      console.log('🎤 Microfone:', novoEstado ? 'ON' : 'OFF')
      return novoEstado
    } catch (error) {
      console.error('Erro ao alternar microfone:', error)
      return microfoneAtivo
    }
  }

  const alternarVideo = () => {
    try {
      const novoEstado = webrtcService.alternarVideo()
      setVideoAtivo(novoEstado)
      console.log('📹 Vídeo:', novoEstado ? 'ON' : 'OFF')
      return novoEstado
    } catch (error) {
      console.error('Erro ao alternar vídeo:', error)
      return videoAtivo
    }
  }

  const finalizarChamadaLocal = () => {
    console.log('🔚 Finalizando chamada local...')
    
    setChamadaAtiva(false)
    setConectado(false)
    setCarregando(false)
    setMicrofoneAtivo(true)
    setVideoAtivo(true)
    setErro(null)
    
    // Limpar vídeos
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    
    // Limpar WebRTC
    webrtcService.limparConexao()
  }

  const encerrarAtendimento = async () => {
    try {
      setCarregando(true)
      console.log('🏁 Encerrando atendimento...')
      
      // Finalizar no backend (só médico pode finalizar)
      if (usuario?.profile?.tipo === 'medico') {
        await finalizarAtendimento(atendimentoId, usuario.profile.id)
        console.log('✅ Atendimento finalizado no backend')
      }
      
      // Finalizar chamada
      webrtcService.finalizarChamada()
      finalizarChamadaLocal()
      
    } catch (error) {
      console.error('❌ Erro ao finalizar atendimento:', error)
      setErro('Erro ao finalizar atendimento: ' + error.message)
      
      // Mesmo com erro, finalizar a chamada localmente
      finalizarChamadaLocal()
    } finally {
      setCarregando(false)
    }
  }

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup useVideoCall')
      finalizarChamadaLocal()
      socketService.removerListener('finalizar_chamada')
    }
  }, [])

  // Debug: log do status da conexão
  useEffect(() => {
    if (chamadaAtiva) {
      const interval = setInterval(() => {
        const status = webrtcService.obterStatusConexao()
        console.log('📊 Status conexão:', status)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [chamadaAtiva])

  return {
    chamadaAtiva,
    conectado,
    microfoneAtivo,
    videoAtivo,
    carregando,
    erro,
    localVideoRef,
    remoteVideoRef,
    iniciarChamada,
    alternarMicrofone,
    alternarVideo,
    encerrarAtendimento,
    finalizarChamadaLocal
  }
}
