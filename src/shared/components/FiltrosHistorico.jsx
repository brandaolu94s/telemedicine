import React, { useState } from 'react'
import { useAuth } from '../../domains/auth/useAuth'

const FiltrosHistorico = ({ filtros, onAplicarFiltros, onLimparFiltros, temFiltrosAtivos }) => {
  const { usuario } = useAuth()
  const [filtrosLocais, setFiltrosLocais] = useState(filtros)

  const handleChange = (campo, valor) => {
    setFiltrosLocais(prev => ({ ...prev, [campo]: valor }))
  }

  const aplicar = () => {
    onAplicarFiltros(filtrosLocais)
  }

  const limpar = () => {
    const filtrosVazios = {
      status: '',
      dataInicio: '',
      dataFim: '',
      tipo: '',
      especialidade: '',
      limite: 50
    }
    setFiltrosLocais(filtrosVazios)
    onLimparFiltros()
  }

  const tiposAtendimento = [
    { valor: '', label: 'Todos os tipos' },
    { valor: 'consulta', label: 'Consulta' },
    { valor: 'retorno', label: 'Retorno' },
    { valor: 'urgente', label: 'Urgente' },
    { valor: 'exame', label: 'Exame' }
  ]

  const especialidades = [
    { valor: '', label: 'Todas especialidades' },
    { valor: 'clinica-geral', label: 'Clínica Geral' },
    { valor: 'cardiologia', label: 'Cardiologia' },
    { valor: 'dermatologia', label: 'Dermatologia' },
    { valor: 'pediatria', label: 'Pediatria' },
    { valor: 'psiquiatria', label: 'Psiquiatria' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        
        {/* Status */}
        <div className="min-w-0 flex-1 min-w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filtrosLocais.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            <option value="finalizado">Finalizado</option>
            <option value="em_andamento">Em andamento</option>
          </select>
        </div>

        {/* Data início */}
        <div className="min-w-0 flex-1 min-w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data início
          </label>
          <input
            type="date"
            value={filtrosLocais.dataInicio}
            onChange={(e) => handleChange('dataInicio', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Data fim */}
        <div className="min-w-0 flex-1 min-w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data fim
          </label>
          <input
            type="date"
            value={filtrosLocais.dataFim}
            onChange={(e) => handleChange('dataFim', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Tipo */}
        <div className="min-w-0 flex-1 min-w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={filtrosLocais.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {tiposAtendimento.map(tipo => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Especialidade (só para paciente) */}
        {usuario?.profile?.tipo === 'paciente' && (
          <div className="min-w-0 flex-1 min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidade
            </label>
            <select
              value={filtrosLocais.especialidade}
              onChange={(e) => handleChange('especialidade', e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {especialidades.map(esp => (
                <option key={esp.valor} value={esp.valor}>
                  {esp.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Botões */}
        <div className="flex space-x-2">
          <button
            onClick={aplicar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Filtrar
          </button>
          {temFiltrosAtivos && (
            <button
              onClick={limpar}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FiltrosHistorico