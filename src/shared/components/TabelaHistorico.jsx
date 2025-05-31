import React from 'react'
import { useAuth } from '../../domains/auth/useAuth'

const TabelaHistorico = ({ atendimentos, carregando }) => {
  const { usuario } = useAuth()

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatarDuracao = (dataInicio, dataFim) => {
    if (!dataFim) return 'Em andamento'
    
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    const minutos = Math.round((fim - inicio) / (1000 * 60))
    
    if (minutos < 60) return `${minutos} min`
    
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}min`
  }

  const obterStatusBadge = (status) => {
    const configs = {
      finalizado: 'bg-green-100 text-green-800 border-green-200',
      em_andamento: 'bg-blue-100 text-blue-800 border-blue-200'
    }

    const labels = {
      finalizado: 'Finalizado',
      em_andamento: 'Em andamento'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${configs[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (carregando) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (atendimentos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum atendimento encontrado</h3>
        <p className="text-gray-600">Não há atendimentos que correspondam aos filtros selecionados.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {usuario?.profile?.tipo === 'medico' ? 'Paciente' : 'Médico'}
              </th>
              {usuario?.profile?.tipo === 'paciente' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialidade
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {atendimentos.map((atendimento) => (
              <tr key={atendimento.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatarData(atendimento.data_inicio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {atendimento.usuarios?.nome || 'N/A'}
                  </div>
                  {usuario?.profile?.tipo === 'medico' && atendimento.usuarios?.telefone && (
                    <div className="text-sm text-gray-500">
                      {atendimento.usuarios.telefone}
                    </div>
                  )}
                  {usuario?.profile?.tipo === 'medico' && atendimento.usuarios?.cpf && (
                    <div className="text-sm text-gray-500">
                      CPF: {atendimento.usuarios.cpf}
                    </div>
                  )}
                </td>
                {usuario?.profile?.tipo === 'paciente' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {atendimento.usuarios?.especialidade || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {atendimento.tipo || 'Consulta'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatarDuracao(atendimento.data_inicio, atendimento.data_fim)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {obterStatusBadge(atendimento.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TabelaHistorico