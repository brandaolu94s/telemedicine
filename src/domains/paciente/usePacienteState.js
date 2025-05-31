import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { socketService } from '../../infra/socket'
import {
  entrarNaFila,
  sairDaFila,
  obterPosicaoNaFila,
  obterFilaCompleta,
  obterMedicosDisponiveis,
  obterHistoricoAtendimentos
} from './pacienteService'

export const usePacienteState = () => {
  const { usuario } = useAuth()
  const [estaNaFila, setEstaNaFila] = useState(false)
  const [posicaoFila, setPosicaoFila] = useState(null)
  const [dadosFila, setDadosFila] = useState(null)
  const [medicosDisponiveis, setMedicosDisponiveis] = useState([])
  const [filaCompleta, setFilaCompleta] = useState([])
  const [historicoAtendimentos, setHistoricoAtendimentos] = useState([])
  const [carregandoFila, setCarregandoFila] = useState(false)
  const [carregandoMedicos, setCarregandoMedicos] = useState(false)
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [statusAtendimento, setStatusAtendimento] = useState(null)
  const [erro, setErro] = useState(null)

  const conectarWebSocket = () => {
    if (usuario?.profile?.id && usuario?.profile?.tipo === 'paciente') {
      socketService.connect(usuario.profile.id, 'paciente')
      
      // Escutar status do atendimento
      socketService.escutarStatusAtendimento((status) => {
        console.log('Status do atendimento:', status)
        setStatusAtendimento(status)
        
        if (status.status === 'aceito') {
          setEstaNaFila(false)
          setPosicaoFila(null)
          setDadosFila(null)
        }
      })
    }
  }

  const entrarFila = async (tipoAtendimento = 'geral') => {
    if (!usuario?.profile?.id) return

    try {
      setCarregandoFila(true)
      setErro(null)
      
      const dadosFila = await entrarNaFila(usuario.profile.id, tipoAtendimento)
      setEstaNaFila(true)
      setDadosFila(dadosFila)
      setPosicaoFila(dadosFila.posicao)
      
      // Notificar médicos via WebSocket
      socketService.emitirNovoPacienteNaFila({
        ...dadosFila,
        usuarios: { nome: usuario.profile.nome }
      })
      
      await carregarFilaCompleta()
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao entrar na fila:', error)
    } finally {
      setCarregandoFila(false)
    }
  }

  const sairFila = async () => {
    if (!usuario?.profile?.id) return

    try {
      setCarregandoFila(true)
      setErro(null)
      
      await sairDaFila(usuario.profile.id)
      setEstaNaFila(false)
      setDadosFila(null)
      setPosicaoFila(null)
      setStatusAtendimento(null)
      
      await carregarFilaCompleta()
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao sair da fila:', error)
    } finally {
      setCarregandoFila(false)
    }
  }

  const verificarPosicaoNaFila = async () => {
    if (!usuario?.profile?.id) return

    try {
      const dados = await obterPosicaoNaFila(usuario.profile.id)
      
      if (dados) {
        setEstaNaFila(true)
        setDadosFila(dados)
        setPosicaoFila(dados.posicao)
      } else {
        setEstaNaFila(false)
        setDadosFila(null)
        setPosicaoFila(null)
      }
    } catch (error) {
      console.error('Erro ao verificar posição na fila:', error)
    }
  }

  const carregarMedicosDisponiveis = async () => {
    try {
      setCarregandoMedicos(true)
      const medicos = await obterMedicosDisponiveis()
      setMedicosDisponiveis(medicos)
    } catch (error) {
      console.error('Erro ao carregar médicos:', error)
    } finally {
      setCarregandoMedicos(false)
    }
  }

  const carregarFilaCompleta = async () => {
    try {
      const fila = await obterFilaCompleta()
      setFilaCompleta(fila)
    } catch (error) {
      console.error('Erro ao carregar fila completa:', error)
    }
  }

  const carregarHistorico = async () => {
    if (!usuario?.profile?.id) return

    try {
      setCarregandoHistorico(true)
      const historico = await obterHistoricoAtendimentos(usuario.profile.id)
      setHistoricoAtendimentos(historico)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  const atualizarDados = async () => {
    await Promise.all([
      verificarPosicaoNaFila(),
      carregarMedicosDisponiveis(),
      carregarFilaCompleta()
    ])
  }

  useEffect(() => {
    if (usuario?.profile?.id) {
      conectarWebSocket()
      atualizarDados()
      carregarHistorico()

      // Atualizar dados a cada 10 segundos
      const interval = setInterval(atualizarDados, 10000)
      
      return () => {
        clearInterval(interval)
        socketService.removerTodosListeners()
        socketService.disconnect()
      }
    }
  }, [usuario?.profile?.id])

  const temMedicosDisponiveis = medicosDisponiveis.length > 0
  const tempoEsperaEstimado = posicaoFila ? posicaoFila * 15 : 0 // 15 min por paciente

  return {
    estaNaFila,
    posicaoFila,
    dadosFila,
    medicosDisponiveis,
    filaCompleta,
    historicoAtendimentos,
    carregandoFila,
    carregandoMedicos,
    carregandoHistorico,
    statusAtendimento,
    erro,
    entrarFila,
    sairFila,
    verificarPosicaoNaFila,
    carregarMedicosDisponiveis,
    carregarHistorico,
    atualizarDados,
    temMedicosDisponiveis,
    tempoEsperaEstimado
  }
}