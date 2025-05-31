import { useState, useEffect } from 'react'
import {
  obterTodosMedicos,
  criarMedico,
  atualizarMedico,
  excluirMedico,
  obterTodosPacientes,
  criarPaciente,
  atualizarPaciente,
  excluirPaciente,
  obterTodosAtendimentos,
  obterEstatisticasGerais
} from './adminService'

export const useAdmin = () => {
  const [medicos, setMedicos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [atendimentos, setAtendimentos] = useState([])
  const [estatisticas, setEstatisticas] = useState(null)
  const [carregandoMedicos, setCarregandoMedicos] = useState(false)
  const [carregandoPacientes, setCarregandoPacientes] = useState(false)
  const [carregandoAtendimentos, setCarregandoAtendimentos] = useState(false)
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false)
  const [erro, setErro] = useState(null)

  // =================== MÉDICOS ===================
  const carregarMedicos = async (filtros = {}) => {
    try {
      setCarregandoMedicos(true)
      setErro(null)
      const dados = await obterTodosMedicos(filtros)
      setMedicos(dados)
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao carregar médicos:', error)
    } finally {
      setCarregandoMedicos(false)
    }
  }

  const adicionarMedico = async (dadosMedico) => {
    try {
      setErro(null)
      const novoMedico = await criarMedico(dadosMedico)
      setMedicos(prev => [novoMedico, ...prev])
      return novoMedico
    } catch (error) {
      setErro(error.message)
      throw error
    }
  }

  const editarMedico = async (medicoId, dadosAtualizados) => {
    try {
      setErro(null)
      const medicoAtualizado = await atualizarMedico(medicoId, dadosAtualizados)
      setMedicos(prev => prev.map(m => m.id === medicoId ? medicoAtualizado : m))
      return medicoAtualizado
    } catch (error) {
      setErro(error.message)
      throw error
    }
  }

  const removerMedico = async (medicoId) => {
    try {
      setErro(null)
      await excluirMedico(medicoId)
      setMedicos(prev => prev.filter(m => m.id !== medicoId))
    } catch (error) {
      setErro(error.message)
      throw error
    }
  }

  // =================== PACIENTES ===================
  const carregarPacientes = async (filtros = {}) => {
    try {
      setCarregandoPacientes(true)
      setErro(null)
      const dados = await obterTodosPacientes(filtros)
      setPacientes(dados)
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setCarregandoPacientes(false)
    }
  }

  const adicionarPaciente = async (dadosPaciente) => {
    try {
      setErro(null)
      const novoPaciente = await criarPaciente(dadosPaciente)
      setPacientes(prev => [novoPaciente, ...prev])
      return novoPaciente
    } catch (error) {
      setErro(error.message)
      throw error
    }
  }

  const editarPaciente = async (pacienteId, dadosAtualizados) => {
    try {
      setErro(null)
      const pacienteAtualizado = await atualizarPaciente(pacienteId, dadosAtualizados)
      setPacientes(prev => prev.map(p => p.id === pacienteId ? pacienteAtualizado : p))
      return pacienteAtualizado
    } catch (error) {
      setErro(error.message)
      throw error
    }
  }

  const removerPaciente = async (pacienteId) => {
    try {
      setErro(null)
      await excluirPaciente(pacienteId)
      setPacientes(prev => prev.filter(p => p.id !== pacienteId))
    } catch (error) {
      setErro(error.message)
      throw error
    }
  }

  // =================== ATENDIMENTOS ===================
  const carregarAtendimentos = async (filtros = {}) => {
    try {
      setCarregandoAtendimentos(true)
      setErro(null)
      const dados = await obterTodosAtendimentos(filtros)
      setAtendimentos(dados)
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao carregar atendimentos:', error)
    } finally {
      setCarregandoAtendimentos(false)
    }
  }

  // =================== ESTATÍSTICAS ===================
  const carregarEstatisticas = async () => {
    try {
      setCarregandoEstatisticas(true)
      setErro(null)
      const dados = await obterEstatisticasGerais()
      setEstatisticas(dados)
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setCarregandoEstatisticas(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarEstatisticas()
    carregarMedicos()
    carregarPacientes()
    carregarAtendimentos({ limite: 50 })

    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(carregarEstatisticas, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    // Dados
    medicos,
    pacientes,
    atendimentos,
    estatisticas,
    
    // Estados de loading
    carregandoMedicos,
    carregandoPacientes,
    carregandoAtendimentos,
    carregandoEstatisticas,
    
    // Erro
    erro,
    
    // Métodos médicos
    carregarMedicos,
    adicionarMedico,
    editarMedico,
    removerMedico,
    
    // Métodos pacientes
    carregarPacientes,
    adicionarPaciente,
    editarPaciente,
    removerPaciente,
    
    // Métodos atendimentos
    carregarAtendimentos,
    
    // Métodos estatísticas
    carregarEstatisticas
  }
}