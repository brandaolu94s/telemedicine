import { useState, useEffect, useRef } from 'react'
import { webrtcService } from '../../infra/webrtc'
import { socketService } from '../../infra/socket'
import { finalizarAtendimento } from './atendimentoService'
import { useAuth } from '../auth/useAuth'

export const useVideoCall = (atendimentoId, isInitiator = false) => {
  const { usuario } = useAuth()
  const [chamadaAtiva, setChamadaAtiva] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [conectandoMidia, setConectandoMidia] = useState(false)
  const [microfoneAtivo, setMicrofoneAtivo] = useState(true)
  const [videoAtivo, setVideoAtivo] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [debugInfo, setDebugInfo] = useState('')
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const atualizarDebug = (mensagem) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => `${timestamp}: ${mensagem}\n${prev}`)
    console.log(`[VideoCall] ${mensagem}`)
  }

  const iniciarChamada = async () => {
    if (!atendimentoId) {
      atualizarDebug('❌ Erro: atendimentoId não fornecido')
      return
    }

    try {
      setCarregando(true)
      setErro(null)
      atualizarDebug(`🚀 Iniciando chamada (${isInitiator ? 'Médico' : 'Paciente'})`)

      // Verificar suporte a WebRTC
      if (!webrtcService.constructor.verificarSuporteWebRTC()) {
        throw new Error('Seu dispositivo não suporta videochamadas')
      }

      // Verificar conexão WebSocket
      if (!socketService.estaConectado()) {
        atualizarDebug('❌ WebSocket não conectado')
        throw new Error('Conexão com servidor perdida. Recarregue a página.')
      }

      atualizarDebug('📡 Socket status: ' + JSON.stringify(socketService.obterStatusConexao()))

      // Configurar callbacks
      webrtcService.setCallbacks({
        onLocalStream: (stream) => {
          atualizarDebug('📹 Stream local obtido')
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            localVideoRef.current.play().catch(e => 
              atualizarDebug('❌ Erro ao reproduzir vídeo local: ' + e.message)
            )
          }
        },
        onRemoteStream: (stream) => {
          atualizarDebug('📺 Stream remoto recebido')
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
            remoteVideoRef.current.play().catch(e => 
              atualizarDebug('❌ Erro ao reproduzir vídeo remoto: ' + e.message)
            )
          }
        },
        onConnect: () => {
          atualizarDebug('✅ Conexão P2P estabelecida')
          setConectado(true)
          setCarregando(false)
        },
        onError: (errorMsg) => {
          atualizarDebug('❌ Erro WebRTC: ' + errorMsg)
          setErro(errorMsg)
          setCarregando(false)
        },
        onClose: () => {
          atualizarDebug('📴 Conexão P2P fechada')
          finalizarChamadaLocal()
        }
      })

      // Inicializar mídia
      setConectandoMidia(true)
      atualizarDebug('🎥 Solicitando acesso à mídia...')
      await webrtcService.inicializarMidia()
      setConectandoMidia(false)
      
      // Criar peer
      atualizarDebug('🔗 Criando peer connection...')
      webrtcService.criarPeer(isInitiator, atendimentoId)
      
      setChamadaAtiva(true)
      atualizarDebug('✅ Chamada iniciada com sucesso')
      
      // Escutar finalização de chamada
      socketService.escutarFinalizarChamada((dados) => {
        if (dados.atendimentoId === atendimentoId) {
          atualizarDebug('📞 Chamada finalizada pelo outro participante')
          finalizarChamadaLocal()
        }
      })

    } catch (error) {
      atualizarDebug('💥 Erro ao iniciar chamada: ' + error.message)
      setErro('Erro ao iniciar chamada: ' + error.message)
      setCarregando(false)
      setConectandoMidia(false)
    }
  }

  const alternarMicrofone = () => {
    const novoEstado = webrtcService.alternarMicrofone()
    setMicrofoneAtivo(novoEstado)
    atualizarDebug(`🎤 Microfone ${novoEstado ? 'ativado' : 'desativado'}`)
    return novoEstado
  }

  const alternarVideo = () => {
    const novoEstado = webrtcService.alternarVideo()
    setVideoAtivo(novoEstado)
    atualizarDebug(`📹 Vídeo ${novoEstado ? 'ativado' : 'desativado'}`)
    return novoEstado
  }

  const finalizarChamadaLocal = () => {
    atualizarDebug('🛑 Finalizando chamada local...')
    setChamadaAtiva(false)
    setConectado(false)
    setCarregando(false)
    setConectandoMidia(false)
    setMicrofoneAtivo(true)
    setVideoAtivo(true)
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    
    webrtcService.limparConexao()
  }

  const encerrarAtendimento = async () => {
    try {
      setCarregando(true)
      atualizarDebug('📝 Finalizando atendimento no servidor...')
      
      // Finalizar no backend
      if (usuario?.profile?.tipo === 'medico') {
        await finalizarAtendimento(atendimentoId, usuario.profile.id)
      }
      
      // Finalizar chamada
      webrtcService.finalizarChamada()
      finalizarChamadaLocal()
      
    } catch (error) {
      atualizarDebug('❌ Erro ao finalizar atendimento: ' + error.message)
      setErro('Erro ao finalizar atendimento: ' + error.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    return () => {
      atualizarDebug('🧹 Cleanup do componente')
      finalizarChamadaLocal()
      socketService.removerListener('finalizar_chamada')
    }
  }, [])

  return {
    chamadaAtiva,
    conectado,
    conectandoMidia,
    microfoneAtivo,
    videoAtivo,
    carregando,
    erro,
    debugInfo,
    localVideoRef,
    remoteVideoRef,
    iniciarChamada,
    alternarMicrofone,
    alternarVideo,
    encerrarAtendimento,
    finalizarChamadaLocal
  }
}
