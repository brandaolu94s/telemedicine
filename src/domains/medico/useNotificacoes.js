import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { socketService } from '../../infra/socket'
import { obterProximoPaciente, aceitarPaciente, recusarPaciente } from '../atendimento/atendimentoService'

export const useNotificacoes = () => {
  const { usuario } = useAuth()
  const [pacienteAtual, setPacienteAtual] = useState(null)
  const [mostrarNotificacao, setMostrarNotificacao] = useState(false)
  const [carregandoAcao, setCarregandoAcao] = useState(false)
  const [erro, setErro] = useState(null)

  const conectarWebSocket = () => {
    if (usuario?.profile?.id && usuario?.profile?.tipo === 'medico') {
      socketService.connect(usuario.profile.id, 'medico')
      
      // Escutar novos pacientes na fila
      socketService.escutarNovoPacienteNaFila((dadosPaciente) => {
        console.log('Novo paciente na fila:', dadosPaciente)
        setPacienteAtual(dadosPaciente)
        setMostrarNotificacao(true)
      })
    }
  }

  const verificarPacientePendente = async () => {
    try {
      const proximoPaciente = await obterProximoPaciente()
      if (proximoPaciente) {
        setPacienteAtual(proximoPaciente)
        setMostrarNotificacao(true)
      }
    } catch (error) {
      console.error('Erro ao verificar paciente pendente:', error)
    }
  }

  const aceitarAtendimento = async () => {
    if (!pacienteAtual || !usuario?.profile?.id) return

    try {
      setCarregandoAcao(true)
      setErro(null)

      await aceitarPaciente(
        usuario.profile.id, 
        pacienteAtual.paciente_id, 
        pacienteAtual.id
      )

      setMostrarNotificacao(false)
      setPacienteAtual(null)
      
      // Recarregar status do médico será feito pelo hook principal
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao aceitar paciente:', error)
    } finally {
      setCarregandoAcao(false)
    }
  }

  const recusarAtendimento = async () => {
    if (!pacienteAtual || !usuario?.profile?.id) return

    try {
      setCarregandoAcao(true)
      setErro(null)

      await recusarPaciente(
        usuario.profile.id,
        pacienteAtual.paciente_id,
        pacienteAtual.id
      )

      setMostrarNotificacao(false)
      setPacienteAtual(null)
      
      // Verificar se há outro paciente
      setTimeout(verificarPacientePendente, 2000)
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao recusar paciente:', error)
    } finally {
      setCarregandoAcao(false)
    }
  }

  const fecharNotificacao = () => {
    setMostrarNotificacao(false)
    setPacienteAtual(null)
    setErro(null)
  }

  useEffect(() => {
    conectarWebSocket()
    verificarPacientePendente()

    return () => {
      socketService.removerTodosListeners()
      socketService.disconnect()
    }
  }, [usuario?.profile?.id])

  return {
    pacienteAtual,
    mostrarNotificacao,
    carregandoAcao,
    erro,
    aceitarAtendimento,
    recusarAtendimento,
    fecharNotificacao
  }
}