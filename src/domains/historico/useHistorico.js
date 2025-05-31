import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { 
  obterHistoricoMedico, 
  obterHistoricoPaciente, 
  obterDetalhesAtendimento,
  obterEstatisticasGerais 
} from './historicoService'

export const useHistorico = () => {
  const { usuario } = useAuth()
  const [atendimentos, setAtendimentos] = useState([])
  const [estatisticas, setEstatisticas] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [filtros, setFiltros] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
    tipo: '',
    especialidade: '',
    limite: 50
  })
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const carregarHistorico = async (novosFiltros = filtros) => {
    if (!usuario?.profile?.id) return

    try {
      setCarregando(true)
      setErro(null)

      let resultado
      if (usuario.profile.tipo === 'medico') {
        resultado = await obterHistoricoMedico(usuario.profile.id, novosFiltros)
      } else if (usuario.profile.tipo === 'paciente') {
        resultado = await obterHistoricoPaciente(usuario.profile.id, novosFiltros)
      } else {
        throw new Error('Tipo de usuário não suportado')
      }

      setAtendimentos(resultado.atendimentos)
      setEstatisticas(resultado.estatisticas)
      
      // Calcular paginação
      const itensPorPagina = 10
      setTotalPaginas(Math.ceil(resultado.atendimentos.length / itensPorPagina))
      
    } catch (error) {
      setErro(error.message)
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setCarregando(false)
    }
  }

  const aplicarFiltros = (novosFiltros) => {
    const filtrosAtualizados = { ...filtros, ...novosFiltros }
    setFiltros(filtrosAtualizados)
    setPaginaAtual(1)
    carregarHistorico(filtrosAtualizados)
  }

  const limparFiltros = () => {
    const filtrosLimpos = {
      status: '',
      dataInicio: '',
      dataFim: '',
      tipo: '',
      especialidade: '',
      limite: 50
    }
    setFiltros(filtrosLimpos)
    setPaginaAtual(1)
    carregarHistorico(filtrosLimpos)
  }

  const obterAtendimentosPaginados = () => {
    const itensPorPagina = 10
    const inicio = (paginaAtual - 1) * itensPorPagina
    const fim = inicio + itensPorPagina
    return atendimentos.slice(inicio, fim)
  }

  const exportarCSV = () => {
    const headers = usuario.profile.tipo === 'medico' 
      ? ['Data', 'Paciente', 'Tipo', 'Duração', 'Status']
      : ['Data', 'Médico', 'Especialidade', 'Tipo', 'Status']
    
    const rows = atendimentos.map(a => {
      const duracao = a.data_fim 
        ? Math.round((new Date(a.data_fim) - new Date(a.data_inicio)) / (1000 * 60)) + ' min'
        : 'Em andamento'

      return usuario.profile.tipo === 'medico'
        ? [
            new Date(a.data_inicio).toLocaleDateString('pt-BR'),
            a.usuarios?.nome || 'N/A',
            a.tipo || 'N/A',
            duracao,
            a.status === 'finalizado' ? 'Finalizado' : 'Em andamento'
          ]
        : [
            new Date(a.data_inicio).toLocaleDateString('pt-BR'),
            a.usuarios?.nome || 'N/A',
            a.usuarios?.especialidade || 'N/A',
            a.tipo || 'N/A',
            a.status === 'finalizado' ? 'Finalizado' : 'Em andamento'
          ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `historico_atendimentos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (usuario?.profile?.id) {
      carregarHistorico()
    }
  }, [usuario?.profile?.id])

  const temFiltrosAtivos = Object.values(filtros).some(valor => 
    valor !== '' && valor !== 50
  )

  return {
    atendimentos: obterAtendimentosPaginados(),
    todosAtendimentos: atendimentos,
    estatisticas,
    carregando,
    erro,
    filtros,
    paginaAtual,
    totalPaginas,
    temFiltrosAtivos,
    carregarHistorico,
    aplicarFiltros,
    limparFiltros,
    setPaginaAtual,
    exportarCSV
  }
}
