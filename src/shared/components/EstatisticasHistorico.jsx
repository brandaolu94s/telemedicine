import React from 'react'
import { useAuth } from '../../domains/auth/useAuth'

const EstatisticasHistorico = ({ estatisticas, carregando }) => {
  const { usuario } = useAuth()

  if (carregando || !estatisticas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
            <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const cards = usuario?.profile?.tipo === 'medico' ? [
    {
      titulo: 'Total de Atendimentos',
      valor: estatisticas.totalAtendimentos,
      icone: '📊',
      cor: 'text-blue-600'
    },
    {
      titulo: 'Atendimentos Finalizados',
      valor: estatisticas.atendimentosFinalizados,
      icone: '✅',
      cor: 'text-green-600'
    },
    {
      titulo: 'Taxa de Conclusão',
      valor: `${estatisticas.taxaConclusao}%`,
      icone: '📈',
      cor: 'text-purple-600'
    },
    {
      titulo: 'Tempo Médio',
      valor: `${estatisticas.tempoMedioAtendimento} min`,
      icone: '⏱️',
      cor: 'text-orange-600'
    }
  ] : [
    {
      titulo: 'Total de Consultas',
      valor: estatisticas.totalAtendimentos,
      icone: '🏥',
      cor: 'text-blue-600'
    },
    {
      titulo: 'Consultas Finalizadas',
      valor: estatisticas.atendimentosFinalizados,
      icone: '✅',
      cor: 'text-green-600'
    },
    {
      titulo: 'Especialidade Principal',
      valor: estatisticas.especialidadesMaisUsadas?.[0]?.nome || 'N/A',
      icone: '👨‍⚕️',
      cor: 'text-purple-600'
    },
    {
      titulo: 'Último Atendimento',
      valor: estatisticas.ultimoAtendimento 
        ? new Date(estatisticas.ultimoAtendimento.data_inicio).toLocaleDateString('pt-BR')
        : 'N/A',
      icone: '📅',
      cor: 'text-orange-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.titulo}
              </p>
              <p className={`text-2xl font-bold ${card.cor}`}>
                {card.valor}
              </p>
            </div>
            <div className="text-2xl">
              {card.icone}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default EstatisticasHistorico