import React, { useState } from 'react'
import { useMedicoState } from './useMedicoState'
import { useNotificacoes } from './useNotificacoes'
import { useAuth } from '../auth/useAuth'
import StatusBadge from '../../shared/components/StatusBadge'
import NotificacaoPaciente from '../../shared/components/NotificacaoPaciente'
import VideoCall from '../../shared/components/VideoCall'
import HistoricoView from '../historico/HistoricoView'

const MedicoView = () => {
  const { usuario, fazerLogout } = useAuth()
  const [atendimentoAtivo, setAtendimentoAtivo] = useState(null)
  const [pacienteAtendimento, setPacienteAtendimento] = useState(null)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  
  const {
    status,
    carregandoStatus,
    estatisticas,
    carregandoEstatisticas,
    erro,
    definirOnline,
    definirOcupado,
    definirPausa,
    definirOffline,
    estaOnline,
    estaOcupado,
    estaPausa,
    estaOffline,
    carregarStatusAtual
  } = useMedicoState()

  const {
    pacienteAtual,
    mostrarNotificacao,
    carregandoAcao,
    erro: erroNotificacao,
    aceitarAtendimento: aceitarAtendimentoOriginal,
    recusarAtendimento,
    fecharNotificacao
  } = useNotificacoes()

  const aceitarAtendimento = async () => {
    try {
      await aceitarAtendimentoOriginal()
      
      // Definir atendimento ativo para iniciar vídeo
      if (pacienteAtual) {
        setAtendimentoAtivo(`${usuario.profile.id}-${pacienteAtual.paciente_id}`)
        setPacienteAtendimento(pacienteAtual.usuarios?.nome || 'Paciente')
      }
      
      // Recarregar status para mostrar "ocupado"
      setTimeout(() => {
        carregarStatusAtual()
      }, 1000)
      
    } catch (error) {
      console.error('Erro ao aceitar atendimento:', error)
    }
  }

  const finalizarAtendimentoLocal = async () => {
    setAtendimentoAtivo(null)
    setPacienteAtendimento(null)
    
    // Voltar para online
    await definirOnline()
  }

  // Se está mostrando histórico
  if (mostrarHistorico) {
    return <HistoricoView onVoltar={() => setMostrarHistorico(false)} />
  }

  const botoesPrincipais = [
    {
      label: 'Ficar Online',
      acao: definirOnline,
      ativo: estaOnline,
      cor: 'bg-green-600 hover:bg-green-700',
      corAtivo: 'bg-green-500',
      disabled: !!atendimentoAtivo
    },
    {
      label: 'Em Pausa',
      acao: definirPausa,
      ativo: estaPausa,
      cor: 'bg-yellow-600 hover:bg-yellow-700',
      corAtivo: 'bg-yellow-500',
      disabled: !!atendimentoAtivo
    },
    {
      label: 'Sair/Offline',
      acao: definirOffline,
      ativo: estaOffline,
      cor: 'bg-gray-600 hover:bg-gray-700',
      corAtivo: 'bg-gray-500',
      disabled: !!atendimentoAtivo
    }
  ]

  // Se há atendimento ativo, mostrar tela de vídeo
  if (atendimentoAtivo) {
    return (
      <VideoCall
        atendimentoId={atendimentoAtivo}
        isInitiator={true}
        nomeRemoto={pacienteAtendimento}
        onClose={finalizarAtendimentoLocal}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Painel Médico
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dr(a). {usuario?.profile?.nome} - {usuario?.profile?.especialidade}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <StatusBadge status={status} />
              {estaOnline && !atendimentoAtivo && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Aguardando pacientes</span>
                </div>
              )}
              <button
                onClick={() => setMostrarHistorico(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Histórico</span>
              </button>
              <button
                onClick={fazerLogout}
                disabled={!!atendimentoAtivo}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controle de Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Controle de Disponibilidade
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {botoesPrincipais.map((botao) => (
                  <button
                    key={botao.label}
                    onClick={botao.acao}
                    disabled={carregandoStatus || botao.disabled}
                    className={`p-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      botao.ativo
                        ? `${botao.corAtivo} text-white`
                        : `${botao.cor} text-white`
                    }`}
                  >
                    {carregandoStatus ? 'Atualizando...' : botao.label}
                  </button>
                ))}
              </div>

              {estaOcupado && atendimentoAtivo && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-800">Atendimento em Andamento</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Videochamada ativa com {pacienteAtendimento}
                      </p>
                    </div>
                    <button
                      onClick={() => setAtendimentoAtivo(atendimentoAtivo)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Voltar à Chamada
                    </button>
                  </div>
                </div>
              )}

              {estaOnline && !estaOcupado && !atendimentoAtivo && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="font-medium text-green-800">Disponível para Atendimento</h3>
                      <p className="text-sm text-green-600 mt-1">
                        Você receberá uma notificação quando um paciente entrar na fila
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(erro || erroNotificacao) && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {erro || erroNotificacao}
                </div>
              )}
            </div>

            {/* Próximos Pacientes */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Fila de Atendimento
              </h2>
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum paciente na fila no momento</p>
                <p className="text-sm mt-1">
                  {estaOnline ? 'Aguardando pacientes...' : 'Fique online para receber pacientes'}
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Estatísticas
                </h2>
                <button
                  onClick={() => setMostrarHistorico(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver histórico completo
                </button>
              </div>
              
              {carregandoEstatisticas ? (
                <div className="space-y-4">
                  <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Atendimentos hoje:</span>
                    <span className="font-medium">{estatisticas.atendimentosHoje}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total atendimentos:</span>
                    <span className="font-medium">{estatisticas.totalAtendimentos}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">Status atual:</span>
                    <div className="mt-2">
                      <StatusBadge status={status} size="sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Histórico Recente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Últimos Atendimentos
              </h2>
              
              {estatisticas.ultimosAtendimentos?.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum atendimento realizado</p>
              ) : (
                <div className="space-y-3">
                  {estatisticas.ultimosAtendimentos?.map((atendimento) => (
                    <div key={atendimento.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {new Date(atendimento.data_inicio).toLocaleDateString()}
                      </span>
                      <span className="text-gray-400">
                        {new Date(atendimento.data_inicio).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Notificação de Novo Paciente */}
      {mostrarNotificacao && !atendimentoAtivo && (
        <NotificacaoPaciente
          paciente={pacienteAtual}
          onAceitar={aceitarAtendimento}
          onRecusar={recusarAtendimento}
          onFechar={fecharNotificacao}
          carregando={carregandoAcao}
          erro={erroNotificacao}
        />
      )}
    </div>
  )
}

export default MedicoView