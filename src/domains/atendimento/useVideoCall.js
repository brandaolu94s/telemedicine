import { useState, useEffect, useRef } from 'react'
import { webrtcService } from '../../infra/webrtc'
import { socketService } from '../../infra/socket'
import { finalizarAtendimento } from './atendimentoService'
import { useAuth } from '../auth/useAuth'

export const useVideoCall = (atendimentoId, isInitiator = false) => {
  const { usuario } = useAuth()
  
  // Estados principais
  const [status, setStatus] = useState('idle') // 'idle', 'connecting', 'connected', 'error', 'disconnected'
  const [chamadaAtiva, setChamadaAtiva] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [progresso, setProgresso] = useState('')
  
  // Estados de mídia
  const [microfoneAtivo, setMicrofoneAtivo] = useState(true)
  const [videoAtivo, setVideoAtivo] = useState(true)
  
  // Estados de reconexão
  const [tentativasReconexao, setTentativasReconexao] = useState(0)
  const [podeReconectar, setPodeReconectar] = useState(true)
  const [problemaRede, setProblemaRede] = useState(false)
  
  // Refs para vídeo
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  
  // Timeouts e intervalos
  const timeoutConexaoRef = useRef(null)
  const intervalStatusRef = useRef(null)

  // Detectar tipo de problema baseado no erro
  const detectarTipoProblema = (errorMessage) => {
    const msg = errorMessage.toLowerCase()
    
    if (msg.includes('network') || msg.includes('ice') || msg.includes('timeout')) {
      setProblemaRede(true)
      return 'rede'
    }
    if (msg.includes('permission') || msg.includes('notallowed')) {
      return 'permissao'
    }
    if (msg.includes('notfound') || msg.includes('device')) {
      return 'dispositivo'
    }
    if (msg.includes('browser') || msg.includes('webrtc')) {
      return 'navegador'
    }
    
    return 'generico'
  }

  const atualizarProgresso = (mensagem) => {
    setProgresso(mensagem)
    console.log(`🔄 [VideoCall] ${mensagem}`)
  }

  const tratarErro = (error, contexto = 'Operação') => {
    const mensagemErro = error.message || error.toString()
    console.error(`❌ [VideoCall] ${contexto}:`, mensagemErro)
    
    setErro(mensagemErro)
    setStatus('error')
    setCarregando(false)
    setConectado(false)
    
    detectarTipoProblema(mensagemErro)
    
    // Definir se pode tentar reconectar
    const tipoErro = detectarTipoProblema(mensagemErro)
    setPodeReconectar(
      tentativasReconexao < 2 && 
      ['rede', 'generico'].includes(tipoErro)
    )
  }

  const limparTimeouts = () => {
    if (timeoutConexaoRef.current) {
      clearTimeout(timeoutConexaoRef.current)
      timeoutConexaoRef.current = null
    }
    if (intervalStatusRef.current) {
      clearInterval(intervalStatusRef.current)
      intervalStatusRef.current = null
    }
  }

  const iniciarChamada = async () => {
    if (!atendimentoId || chamadaAtiva) return

    try {
      setCarregando(true)
      setErro(null)
      setStatus('connecting')
      atualizarProgresso('Inicializando sistema de vídeo...')
      
      // Timeout para conexão
      timeoutConexaoRef.current = setTimeout(() => {
        if (!conectado) {
          tratarErro(new Error('Timeout: Conexão demorou muito para estabelecer'), 'Timeout de Conexão')
        }
      }, 30000) // 30 segundos

      // Configurar callbacks do WebRTC
      webrtcService.setCallbacks({
        onLocalStream: (stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            atualizarProgresso('Câmera local ativada')
          }
        },
        onRemoteStream: (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
            atualizarProgresso('Conectado! Recebendo vídeo...')
          }
        },
        onConnect: () => {
          setConectado(true)
          setStatus('connected')
          setCarregando(false)
          limparTimeouts()
          atualizarProgresso('Conexão estabelecida com sucesso!')
          
          // Limpar progresso após alguns segundos
          setTimeout(() => setProgresso(''), 3000)
        },
        onError: (errorMsg) => {
          tratarErro(new Error(errorMsg), 'WebRTC')
        },
        onClose: () => {
          finalizarChamadaLocal()
        }
      })

      // Inicializar mídia com progresso
      atualizarProgresso('Acessando câmera e microfone...')
      await webrtcService.inicializarMidia()
      
      atualizarProgresso('Criando conexão segura...')
      // Criar peer connection
      webrtcService.criarPeer(isInitiator, atendimentoId)
      
      setChamadaAtiva(true)
      atualizarProgresso('Aguardando resposta do participante...')
      
      // Escutar finalização de chamada via WebSocket
      socketService.escutarFinalizarChamada((dados) => {
        if (dados.atendimentoId === atendimentoId) {
          finalizarChamadaLocal()
        }
      })

      // Monitorar status da conexão
      intervalStatusRef.current = setInterval(() => {
        if (chamadaAtiva && !conectado && !carregando) {
          console.warn('⚠️ [VideoCall] Chamada ativa mas não conectada - possível problema')
        }
      }, 5000)

    } catch (error) {
      tratarErro(error, 'Inicialização da Chamada')
    }
  }

  const tentarReconexao = async () => {
    if (tentativasReconexao >= 2) {
      setPodeReconectar(false)
      return
    }

    console.log(`🔄 [VideoCall] Tentativa de reconexão ${tentativasReconexao + 1}/2`)
    
    setTentativasReconexao(prev => prev + 1)
    setErro(null)
    setStatus('connecting')
    
    // Limpar conexão anterior
    webrtcService.limparConexao()
    
    // Aguardar um pouco antes de tentar reconectar
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Tentar novamente
    await iniciarChamada()
  }

  const alternarMicrofone = () => {
    try {
      const novoEstado = webrtcService.alternarMicrofone()
      setMicrofoneAtivo(novoEstado)
      
      // Feedback visual
      atualizarProgresso(novoEstado ? 'Microfone ativado' : 'Microfone silenciado')
      setTimeout(() => setProgresso(''), 2000)
      
      return novoEstado
    } catch (error) {
      console.error('❌ [VideoCall] Erro ao alternar microfone:', error)
      tratarErro(error, 'Controle de Microfone')
    }
  }

  const alternarVideo = () => {
    try {
      const novoEstado = webrtcService.alternarVideo()
      setVideoAtivo(novoEstado)
      
      // Feedback visual
      atualizarProgresso(novoEstado ? 'Câmera ativada' : 'Câmera desligada')
      setTimeout(() => setProgresso(''), 2000)
      
      return novoEstado
    } catch (error) {
      console.error('❌ [VideoCall] Erro ao alternar vídeo:', error)
      tratarErro(error, 'Controle de Vídeo')
    }
  }

  const finalizarChamadaLocal = () => {
    console.log('🔚 [VideoCall] Finalizando chamada local')
    
    setChamadaAtiva(false)
    setConectado(false)
    setCarregando(false)
    setStatus('disconnected')
    setMicrofoneAtivo(true)
    setVideoAtivo(true)
    setProgresso('')
    
    // Limpar referências de vídeo
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    
    // Limpar timeouts e intervalos
    limparTimeouts()
    
    // Limpar conexão WebRTC
    webrtcService.limparConexao()
  }

  const encerrarAtendimento = async () => {
    try {
      setCarregando(true)
      atualizarProgresso('Finalizando atendimento...')
      
      // Finalizar no backend se for médico
      if (usuario?.profile?.tipo === 'medico' && atendimentoId) {
        const realAtendimentoId = atendimentoId.split('-')[2] // Extrair ID real
        await finalizarAtendimento(realAtendimentoId, usuario.profile.id)
      }
      
      // Notificar via WebSocket
      webrtcService.finalizarChamada()
      
      // Finalizar localmente
      finalizarChamadaLocal()
      
    } catch (error) {
      console.error('❌ [VideoCall] Erro ao finalizar atendimento:', error)
      // Mesmo com erro, finalizar localmente
      finalizarChamadaLocal()
    }
  }

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      console.log('🧹 [VideoCall] Cleanup do componente')
      finalizarChamadaLocal()
      socketService.removerListener('finalizar_chamada')
    }
  }, [])

  // Monitorar mudanças no atendimentoId
  useEffect(() => {
    if (!atendimentoId) {
      console.warn('⚠️ [VideoCall] atendimentoId não fornecido')
      setErro('ID do atendimento não informado')
      setStatus('error')
    }
  }, [atendimentoId])

  return {
    // Estados principais
    status,
    chamadaAtiva,
    conectado,
    carregando,
    erro,
    progresso,
    
    // Estados de mídia
    microfoneAtivo,
    videoAtivo,
    
    // Estados de reconexão
    tentativasReconexao,
    podeReconectar,
    problemaRede,
    
    // Refs
    localVideoRef,
    remoteVideoRef,
    
    // Funções
    iniciarChamada,
    tentarReconexao,
    alternarMicrofone,
    alternarVideo,
    encerrarAtendimento,
    finalizarChamadaLocal
  }
}
