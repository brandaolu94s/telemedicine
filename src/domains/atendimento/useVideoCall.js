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
  const [progresso, setProgresso] = useState('')
  const [tentativasReconexao, setTentativasReconexao] = useState(0)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const iniciarChamada = async () => {
    if (!atendimentoId) {
      setErro('ID do atendimento é obrigatório')
      return
    }

    try {
      setCarregando(true)
      setErro(null)
      setProgresso('Verificando sistema...')
      setTentativasReconexao(0)

      console.log('🚀 Iniciando chamada...', { atendimentoId, isInitiator })

      const suporte = webrtcService.verificarSuporteWebRTC()
      if (!suporte.supported) {
        throw new Error('Seu navegador não suporta videochamadas. Use Chrome, Firefox ou Safari.')
      }

      webrtcService.setCallbacks({
        onLocalStream: (stream) => {
          console.log('📹 Stream local recebido')
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            localVideoRef.current.play().catch(e => console.warn('Autoplay local bloqueado:', e))
          }
        },
        
        onRemoteStream: (stream) => {
          console.log('📺 Stream remoto recebido')
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
            remoteVideoRef.current.play().catch(e => console.warn('Autoplay remoto bloqueado:', e))
          }
        },
        
        onConnect: () => {
          console.log('✅ Conectado com sucesso!')
          setConectado(true)
          setCarregando(false)
          setProgresso('Conectado!')
        },
        
        onError: (errorMsg) => {
          console.error('❌ Erro WebRTC:', errorMsg)
          setErro(errorMsg)
          setCarregando(false)
          setProgresso('')
        },
        
        onClose: () => {
          console.log('📞 Chamada encerrada')
          finalizarChamadaLocal()
        },
        
        onProgress: (mensagem) => {
          setProgresso(mensagem)
        }
      })

      await webrtcService.inicializarMidia()
      console.log('🎥 Mídia inicializada')
      
      webrtcService.criarPeer(isInitiator, atendimentoId)
      console.log('🔗 Peer criado')
      
      setChamadaAtiva(true)
      
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
      setProgresso('')
    }
  }

  const tentarReconexao = async () => {
    if (tentativasReconexao >= 2) {
      setErro('Conexão instável. Entre em contato com suporte técnico.')
      return
    }

    try {
      setTentativasReconexao(prev => prev + 1)
      setCarregando(true)
      setErro(null)
      setProgresso(`Reconectando (${tentativasReconexao + 1}/2)...`)
      
      console.log(`🔄 Reconexão ${tentativasReconexao + 1}`)
      
      await webrtcService.forcarReconexao()
      
    } catch (error) {
      console.error('❌ Reconexão falhou:', error)
      setErro('Falha na reconexão: ' + error.message)
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
    console.log('🔚 Finalizando chamada local')
    
    setChamadaAtiva(false)
    setConectado(false)
    setCarregando(false)
    setMicrofoneAtivo(true)
    setVideoAtivo(true)
    setErro(null)
    setProgresso('')
    setTentativasReconexao(0)
    
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
      console.log('🏁 Encerrando atendimento')
      
      setCarregando(true)
      setProgresso('Finalizando...')
      
      if (usuario?.profile?.tipo === 'medico') {
        await finalizarAtendimento(atendimentoId, usuario.profile.id)
        console.log('✅ Finalizado no backend')
      }
      
      webrtcService.finalizarChamada()
      finalizarChamadaLocal()
      
    } catch (error) {
      console.error('❌ Erro ao finalizar', error)
      finalizarChamadaLocal()
    }
  }

  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup automático')
      finalizarChamadaLocal()
      socketService.removerListener('finalizar_chamada')
    }
  }, [])

  return {
    chamadaAtiva,
    conectado,
    microfoneAtivo,
    videoAtivo,
    carregando,
    erro,
    progresso,
    tentativasReconexao,
    localVideoRef,
    remoteVideoRef,
    iniciarChamada,
    tentarReconexao,
    alternarMicrofone,
    alternarVideo,
    encerrarAtendimento,
    finalizarChamadaLocal,
    podeReconectar: tentativasReconexao < 2 && erro && !conectado
  }
}
