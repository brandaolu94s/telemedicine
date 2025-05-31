import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { 
  atualizarStatusMedico, 
  obterStatusMedico, 
  obterEstatisticasMedico 
} from './medicoService'

export const useMedicoState = () => {
  const { usuario } = useAuth()
  const [status, setStatus] = useState('offline')
  const [carregandoStatus, setCarregandoStatus] = useState(false)
  const [estatisticas, setEstatisticas] = useState({
    totalAtendimentos: 0,
    atendimentosHoje: 0,
    ultimosAtendimentos: []
  })
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false)
  const [erro, setErro] = useState(null)

  const alterarStatus = async (novoStatus) => {
    if (!usuario?.profile?.id) return

    try {
      setCarregandoStatus(true)
      setErro(null)
      
      await atualizarStatusMedico(usuario.profile.id, novoStatus)
      setStatus(novoStatus)
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao alterar status:', error)
    } finally {
      setCarregandoStatus(false)
    }
  }

  const definirOnline = () => alterarStatus('online')
  const definirOcupado = () => alterarStatus('ocupado')
  const definirPausa = () => alterarStatus('pausa')
  const definirOffline = () => alterarStatus('offline')

  const carregarStatusAtual = async () => {
    if (!usuario?.profile?.id) return

    try {
      setCarregandoStatus(true)
      const statusAtual = await obterStatusMedico(usuario.profile.id)
      setStatus(statusAtual || 'offline')
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao carregar status:', error)
    } finally {
      setCarregandoStatus(false)
    }
  }

  const carregarEstatisticas = async () => {
    if (!usuario?.profile?.id) return

    try {
      setCarregandoEstatisticas(true)
      const stats = await obterEstatisticasMedico(usuario.profile.id)
      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setCarregandoEstatisticas(false)
    }
  }

  useEffect(() => {
    if (usuario?.profile?.id) {
      carregarStatusAtual()
      carregarEstatisticas()
    }
  }, [usuario?.profile?.id])

  const estaOnline = status === 'online'
  const estaOcupado = status === 'ocupado'
  const estaPausa = status === 'pausa'
  const estaOffline = status === 'offline'

  return {
    status,
    carregandoStatus,
    estatisticas,
    carregandoEstatisticas,
    erro,
    alterarStatus,
    definirOnline,
    definirOcupado,
    definirPausa,
    definirOffline,
    carregarStatusAtual,
    carregarEstatisticas,
    estaOnline,
    estaOcupado,
    estaPausa,
    estaOffline
  }
}