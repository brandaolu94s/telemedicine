import React from 'react'

const NotificacaoPaciente = ({
  paciente,
  onAceitar,
  onRecusar,
  onFechar,
  carregando,
  erro
}) => {
  if (!paciente) return null

  const formatarTempo = (dataString) => {
    const minutos = Math.floor((new Date() - new Date(dataString)) / 60000)
    if (minutos < 1) return 'agora mesmo'
    if (minutos === 1) return '1 minuto atrás'
    return `${minutos} minutos atrás`
  }

  const obterLabelTipo = (tipo) => {
    const tipos = {
      geral: 'Consulta Geral',
      urgente: 'Atendimento Urgente',
      retorno: 'Retorno',
      exame: 'Resultado de Exame'
    }
    return tipos[tipo] || tipo
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Novo Paciente</h3>
              <p className="text-sm text-gray-600">Aguardando atendimento</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Nome:</span>
              <span className="text-sm font-medium text-gray-800">
                {paciente.usuarios?.nome || 'Paciente'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className="text-sm font-medium text-gray-800">
                {obterLabelTipo(paciente.tipo_atendimento)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Posição:</span>
              <span className="text-sm font-medium text-blue-600">
                #{paciente.posicao}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Aguardando:</span>
              <span className="text-sm font-medium text-gray-800">
                {formatarTempo(paciente.criado_em)}
              </span>
            </div>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onRecusar}
            disabled={carregando}
            className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {carregando ? 'Processando...' : 'Recusar'}
          </button>
          <button
            onClick={onAceitar}
            disabled={carregando}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {carregando ? 'Processando...' : 'Aceitar'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Esta notificação será enviada para outro médico se não for aceita
        </p>
      </div>
    </div>
  )
}

export default NotificacaoPaciente