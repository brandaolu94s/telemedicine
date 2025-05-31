import React, { useState } from 'react'
import { usePacienteState } from './usePacienteState'
import { useAuth } from '../auth/useAuth'
import StatusBadge from '../../shared/components/StatusBadge'
import MedicoCard from '../../shared/components/MedicoCard'
import VideoCall from '../../shared/components/VideoCall'
import HistoricoView from '../historico/HistoricoView'

const PacienteView = () => {
  const { usuario, fazerLogout } = useAuth()
  const [atendimentoAtivo, setAtendimentoAtivo] = useState(null)
  const [medicoAtendimento, setMedicoAtendimento] = useState(null)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  
  const {
    estaNaFila,
    posicaoFila,
    dadosFila,
    medicosDisponiveis,
    filaCompleta,
    statusAtendimento,
    erro,
    entrarFila,
    sairFila,
    temMedicosDisponiveis,
    tempoEsperaEstimado
  } = usePacienteState()

  const [tipoAtendimentoSelecionado, setTipoAtendimentoSelecionado] = useState('geral')

  // Monitorar status do atendimento para iniciar vídeo
  React.useEffect(() => {
    if (statusAtendimento?.status === 'aceito' && !atendimentoAtivo) {
      setAtendimentoAtivo(statusAtendimento.atendimentoId)
      setMedicoAtendimento('Médico')
    }
  }, [statusAtendimento, atendimentoAtivo])

  const finalizarAtendimentoLocal = () => {
    setAtendimentoAtivo(null)
    setMedicoAtendimento(null)
  }

  // Se está mostrando histórico
  if (mostrarHistorico) {
    return <HistoricoView onVoltar={() => setMostrarHistorico(false)} />
  }

  const tiposAtendimento = [
    { valor: 'geral', label: 'Consulta Geral' },
    { valor: 'urgente', label: 'Atendimento Urgente' },
    { valor: 'retorno', label: 'Retorno' },
    { valor: 'exame', label: 'Resultado de Exame' }
  ]

  const formatarTempo = (minutos) => {
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}min`
  }

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Se há atendimento ativo, mostrar tela de vídeo
  if (atendimentoAtivo) {
    return (
      <VideoCall
        atendimentoId={atendimentoAtivo}
        isInitiator={false}
        nomeRemoto={medicoAtendimento}
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
                Teleatendimento
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Olá, {usuario?.profile?.nome}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {estaNaFila && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Posição:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    #{posicaoFila}
                  </span>
                </div>
              )}
              {statusAtendimento?.status === 'aceito' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Médico aceitou!</span>
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

      {/* Resto do componente permanece igual... */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Área Principal - Fila */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Notificação de aceite */}
            {statusAtendimento?.status === 'aceito' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800">Atendimento Aceito!</h3>
                    <p className="text-sm text-green-600 mt-1">
                      Um médico aceitou seu atendimento. Prepare-se para a videochamada.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setAtendimentoAtivo(statusAtendimento.atendimentoId)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Iniciar Videochamada
                  </button>
                </div>
              </div>
            )}
            
            {!estaNaFila && !statusAtendimento ? (
              /* Entrada na Fila */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Entrar na Fila de Atendimento
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Atendimento
                    </label>
                    <select
                      value={tipoAtendimentoSelecionado}
                      onChange={(e) => setTipoAtendimentoSelecionado(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {tiposAtendimento.map(tipo => (
                        <option key={tipo.valor} value={tipo.valor}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!temMedicosDisponiveis && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Nenhum médico disponível no momento
                          </h3>
                          <p className="mt-1 text-sm text-yellow-700">
                            Você pode entrar na fila e será atendido assim que um médico ficar disponível.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => entrarFila(tipoAtendimentoSelecionado)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Entrar na Fila
                  </button>
                </div>
              </div>
            ) : estaNaFila ? (
              /* Status na Fila */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-medium text-gray-800">
                    Você está na fila de atendimento
                  </h2>
                  <button
                    onClick={sairFila}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sair da Fila
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">#{posicaoFila}</div>
                    <div className="text-sm text-gray-600 mt-1">Sua posição</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{filaCompleta.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Total na fila</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatarTempo(tempoEsperaEstimado)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Tempo estimado</div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo de atendimento:</span>
                    <span className="font-medium capitalize">
                      {tiposAtendimento.find(t => t.valor === dadosFila?.tipo_atendimento)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Entrou na fila:</span>
                    <span className="font-medium">
                      {dadosFila?.criado_em && formatarData(dadosFila.criado_em)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {erro && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {erro}
              </div>
            )}

            {/* Fila Atual */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Fila Atual de Atendimento
              </h2>
              
              {filaCompleta.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum paciente na fila</p>
              ) : (
                <div className="space-y-3">
                  {filaCompleta.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.paciente_id === usuario?.profile?.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {item.posicao}
                        </span>
                        <div>
                          <div className="font-medium text-gray-800">
                            {item.paciente_id === usuario?.profile?.id ? 'Você' : item.usuarios.nome}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {tiposAtendimento.find(t => t.valor === item.tipo_atendimento)?.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatarData(item.criado_em)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Médicos Disponíveis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Médicos Disponíveis
              </h2>
              
              {medicosDisponiveis.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum médico online no momento</p>
              ) : (
                <div className="space-y-3">
                  {medicosDisponiveis.map(medico => (
                    <MedicoCard key={medico.id} medico={medico} size="sm" />
                  ))}
                </div>
              )}
            </div>

            {/* Resumo do Histórico */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Consultas Anteriores
                </h2>
                <button
                  onClick={() => setMostrarHistorico(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver histórico completo
                </button>
              </div>
              
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  Clique em "Histórico" no topo para ver todas as suas consultas realizadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PacienteView

