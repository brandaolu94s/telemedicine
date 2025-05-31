import React from 'react'
import { useHistorico } from './useHistorico'
import { useAuth } from '../auth/useAuth'
import FiltrosHistorico from '../../shared/components/FiltrosHistorico'
import TabelaHistorico from '../../shared/components/TabelaHistorico'
import EstatisticasHistorico from '../../shared/components/EstatisticasHistorico'
import Paginacao from '../../shared/components/Paginacao'

const HistoricoView = ({ onVoltar }) => {
  const { usuario } = useAuth()
  const {
    atendimentos,
    todosAtendimentos,
    estatisticas,
    carregando,
    erro,
    filtros,
    paginaAtual,
    totalPaginas,
    temFiltrosAtivos,
    aplicarFiltros,
    limparFiltros,
    setPaginaAtual,
    exportarCSV
  } = useHistorico()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={onVoltar}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  Histórico de Atendimentos
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {usuario?.profile?.tipo === 'medico' 
                    ? 'Seus atendimentos realizados'
                    : 'Suas consultas médicas'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {todosAtendimentos.length > 0 && (
                <button
                  onClick={exportarCSV}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Estatísticas */}
        <EstatisticasHistorico 
          estatisticas={estatisticas} 
          carregando={carregando} 
        />

        {/* Filtros */}
        <FiltrosHistorico
          filtros={filtros}
          onAplicarFiltros={aplicarFiltros}
          onLimparFiltros={limparFiltros}
          temFiltrosAtivos={temFiltrosAtivos}
        />

        {/* Erro */}
        {erro && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {erro}
          </div>
        )}

        {/* Tabela */}
        <TabelaHistorico 
          atendimentos={atendimentos} 
          carregando={carregando} 
        />

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="mt-6">
            <Paginacao
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
              onChange={setPaginaAtual}
            />
          </div>
        )}

        {/* Resumo */}
        {todosAtendimentos.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Mostrando {atendimentos.length} de {todosAtendimentos.length} atendimentos
            {temFiltrosAtivos && ' (filtrados)'}
          </div>
        )}

      </main>
    </div>
  )
}

export default HistoricoView
