// 📁 /src/domains/admin/AdminView.jsx (CORRIGIDO - sem confirm e variáveis não usadas)
import React, { useState } from 'react'
import { useAdmin } from './useAdmin'
import { useAuth } from '../auth/useAuth'
import StatusBadge from '../../shared/components/StatusBadge'
import Modal from '../../shared/components/Modal'
import FormMedico from '../../shared/components/FormMedico'
import FormPaciente from '../../shared/components/FormPaciente'
import SenhaGeradaModal from '../../shared/components/SenhaGeradaModal'

const AdminView = () => {
  const { usuario, fazerLogout } = useAuth()
  const {
    medicos,
    pacientes,
    atendimentos,
    estatisticas,
    carregandoMedicos,
    carregandoPacientes,
    carregandoAtendimentos,
    carregandoEstatisticas,
    erro,
    adicionarMedico,
    editarMedico,
    removerMedico,
    adicionarPaciente,
    editarPaciente,
    removerPaciente,
    carregarAtendimentos
  } = useAdmin()

  const [abaSelecionada, setAbaSelecionada] = useState('dashboard')
  const [modalMedico, setModalMedico] = useState({ isOpen: false, medico: null })
  const [modalPaciente, setModalPaciente] = useState({ isOpen: false, paciente: null })
  const [modalSenhaGerada, setModalSenhaGerada] = useState({ isOpen: false, usuario: null, senha: '' })
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, tipo: '', id: '', nome: '' })
  const [carregandoAcao, setCarregandoAcao] = useState(false)

  // ================ HANDLERS MÉDICOS ================
  const handleCriarMedico = async (dadosMedico) => {
    try {
      setCarregandoAcao(true)
      const resultado = await adicionarMedico(dadosMedico)
      
      setModalMedico({ isOpen: false, medico: null })
      
      // Se foi gerada uma senha, mostrar modal
      if (resultado.senhaGerada) {
        setModalSenhaGerada({
          isOpen: true,
          usuario: resultado,
          senha: resultado.senhaGerada
        })
      }
    } catch (error) {
      console.error('Erro ao criar médico:', error)
    } finally {
      setCarregandoAcao(false)
    }
  }

  const handleEditarMedico = async (dadosMedico) => {
    try {
      setCarregandoAcao(true)
      await editarMedico(modalMedico.medico.id, dadosMedico)
      setModalMedico({ isOpen: false, medico: null })
    } catch (error) {
      console.error('Erro ao editar médico:', error)
    } finally {
      setCarregandoAcao(false)
    }
  }

  const confirmarExclusaoMedico = (medico) => {
    setModalConfirmacao({
      isOpen: true,
      tipo: 'medico',
      id: medico.id,
      nome: medico.nome
    })
  }

  const handleExcluirMedico = async () => {
    try {
      await removerMedico(modalConfirmacao.id)
      setModalConfirmacao({ isOpen: false, tipo: '', id: '', nome: '' })
    } catch (error) {
      console.error('Erro ao excluir médico:', error)
    }
  }

  // ================ HANDLERS PACIENTES ================
  const handleCriarPaciente = async (dadosPaciente) => {
    try {
      setCarregandoAcao(true)
      const resultado = await adicionarPaciente(dadosPaciente)
      
      setModalPaciente({ isOpen: false, paciente: null })
      
      // Se foi gerada uma senha, mostrar modal
      if (resultado.senhaGerada) {
        setModalSenhaGerada({
          isOpen: true,
          usuario: resultado,
          senha: resultado.senhaGerada
        })
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error)
    } finally {
      setCarregandoAcao(false)
    }
  }

  const handleEditarPaciente = async (dadosPaciente) => {
    try {
      setCarregandoAcao(true)
      await editarPaciente(modalPaciente.paciente.id, dadosPaciente)
      setModalPaciente({ isOpen: false, paciente: null })
    } catch (error) {
      console.error('Erro ao editar paciente:', error)
    } finally {
      setCarregandoAcao(false)
    }
  }

  const confirmarExclusaoPaciente = (paciente) => {
    setModalConfirmacao({
      isOpen: true,
      tipo: 'paciente',
      id: paciente.id,
      nome: paciente.nome
    })
  }

  const handleExcluirPaciente = async () => {
    try {
      await removerPaciente(modalConfirmacao.id)
      setModalConfirmacao({ isOpen: false, tipo: '', id: '', nome: '' })
    } catch (error) {
      console.error('Erro ao excluir paciente:', error)
    }
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

  const abas = [
    { id: 'dashboard', label: 'Dashboard', icone: '📊' },
    { id: 'medicos', label: 'Médicos', icone: '👨‍⚕️' },
    { id: 'pacientes', label: 'Pacientes', icone: '👥' },
    { id: 'atendimentos', label: 'Atendimentos', icone: '📋' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bem-vindo, {usuario?.profile?.nome}
              </p>
            </div>
            <button
              onClick={fazerLogout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegação por abas */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {abas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaSelecionada(aba.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                abaSelecionada === aba.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>{aba.icone}</span>
              <span>{aba.label}</span>
            </button>
          ))}
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {erro}
          </div>
        )}

        {/* Dashboard */}
        {abaSelecionada === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-800">Visão Geral do Sistema</h2>
            
            {carregandoEstatisticas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
                  </div>
                ))}
              </div>
            ) : estatisticas ? (
              <>
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Médicos Online</p>
                        <p className="text-2xl font-bold text-green-600">{estatisticas.medicos.online}</p>
                      </div>
                      <div className="text-2xl">🟢</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Médicos Ocupados</p>
                        <p className="text-2xl font-bold text-red-600">{estatisticas.medicos.ocupados}</p>
                      </div>
                      <div className="text-2xl">🔴</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Fila Atual</p>
                        <p className="text-2xl font-bold text-blue-600">{estatisticas.fila.atual}</p>
                      </div>
                      <div className="text-2xl">⏳</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Pacientes</p>
                        <p className="text-2xl font-bold text-purple-600">{estatisticas.pacientes.total}</p>
                      </div>
                      <div className="text-2xl">👥</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Atendimentos Hoje</p>
                        <p className="text-2xl font-bold text-indigo-600">{estatisticas.atendimentos.hoje.total}</p>
                      </div>
                      <div className="text-2xl">📅</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Finalizados Hoje</p>
                        <p className="text-2xl font-bold text-green-600">{estatisticas.atendimentos.hoje.finalizados}</p>
                      </div>
                      <div className="text-2xl">✅</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Em Andamento</p>
                        <p className="text-2xl font-bold text-yellow-600">{estatisticas.atendimentos.hoje.emAndamento}</p>
                      </div>
                      <div className="text-2xl">🔄</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Médicos</p>
                        <p className="text-2xl font-bold text-gray-600">{estatisticas.medicos.total}</p>
                      </div>
                      <div className="text-2xl">👨‍⚕️</div>
                    </div>
                  </div>
                </div>

                {/* Status dos médicos em tempo real */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Status dos Médicos</h3>
                  {carregandoMedicos ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicos.slice(0, 5).map(medico => (
                        <div key={medico.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {medico.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{medico.nome}</p>
                              <p className="text-sm text-gray-600">{medico.especialidade}</p>
                            </div>
                          </div>
                          <StatusBadge status={medico.status || 'offline'} size="sm" />
                        </div>
                      ))}
                      {medicos.length > 5 && (
                        <button
                          onClick={() => setAbaSelecionada('medicos')}
                          className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver todos os médicos ({medicos.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Erro ao carregar estatísticas</p>
              </div>
            )}
          </div>
        )}

        {/* Médicos */}
        {abaSelecionada === 'medicos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Gerenciar Médicos</h2>
              <button
                onClick={() => setModalMedico({ isOpen: true, medico: null })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Novo Médico</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {carregandoMedicos ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : medicos.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600">Nenhum médico cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CRM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {medicos.map(medico => (
                        <tr key={medico.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{medico.nome}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{medico.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{medico.crm}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{medico.especialidade}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={medico.status || 'offline'} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => setModalMedico({ isOpen: true, medico })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => confirmarExclusaoMedico(medico)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pacientes */}
        {abaSelecionada === 'pacientes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Gerenciar Pacientes</h2>
              <button
                onClick={() => setModalPaciente({ isOpen: true, paciente: null })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Novo Paciente</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {carregandoPacientes ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : pacientes.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600">Nenhum paciente cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pacientes.map(paciente => (
                        <tr key={paciente.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{paciente.nome}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.telefone}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.cpf}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatarData(paciente.criado_em)}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => setModalPaciente({ isOpen: true, paciente })}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => confirmarExclusaoPaciente(paciente)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Atendimentos */}
        {abaSelecionada === 'atendimentos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Histórico de Atendimentos</h2>
              <button
                onClick={() => carregarAtendimentos()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Atualizar</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {carregandoAtendimentos ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : atendimentos.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600">Nenhum atendimento encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {atendimentos.map(atendimento => {
                        const duracao = atendimento.data_fim 
                          ? Math.round((new Date(atendimento.data_fim) - new Date(atendimento.data_inicio)) / (1000 * 60)) + ' min'
                          : 'Em andamento'

                        return (
                          <tr key={atendimento.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatarData(atendimento.data_inicio)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {atendimento.paciente?.nome || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {atendimento.paciente?.telefone}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {atendimento.medico?.nome || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {atendimento.medico?.especialidade}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                              {atendimento.tipo || 'Consulta'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {duracao}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                atendimento.status === 'finalizado' 
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                {atendimento.status === 'finalizado' ? 'Finalizado' : 'Em andamento'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Médico */}
      <Modal
        isOpen={modalMedico.isOpen}
        onClose={() => setModalMedico({ isOpen: false, medico: null })}
        title={modalMedico.medico ? 'Editar Médico' : 'Novo Médico'}
        size="md"
      >
        <FormMedico
          medico={modalMedico.medico}
          onSubmit={modalMedico.medico ? handleEditarMedico : handleCriarMedico}
          onCancel={() => setModalMedico({ isOpen: false, medico: null })}
          carregando={carregandoAcao}
        />
      </Modal>

      {/* Modal Paciente */}
      <Modal
        isOpen={modalPaciente.isOpen}
        onClose={() => setModalPaciente({ isOpen: false, paciente: null })}
        title={modalPaciente.paciente ? 'Editar Paciente' : 'Novo Paciente'}
        size="md"
      >
        <FormPaciente
          paciente={modalPaciente.paciente}
          onSubmit={modalPaciente.paciente ? handleEditarPaciente : handleCriarPaciente}
          onCancel={() => setModalPaciente({ isOpen: false, paciente: null })}
          carregando={carregandoAcao}
        />
      </Modal>

      {/* Modal Confirmação de Exclusão */}
      <Modal
        isOpen={modalConfirmacao.isOpen}
        onClose={() => setModalConfirmacao({ isOpen: false, tipo: '', id: '', nome: '' })}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Excluir {modalConfirmacao.tipo}
          </h3>
          
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja excluir <strong>{modalConfirmacao.nome}</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={() => setModalConfirmacao({ isOpen: false, tipo: '', id: '', nome: '' })}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={modalConfirmacao.tipo === 'medico' ? handleExcluirMedico : handleExcluirPaciente}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Senha Gerada */}
      <SenhaGeradaModal
        isOpen={modalSenhaGerada.isOpen}
        onClose={() => setModalSenhaGerada({ isOpen: false, usuario: null, senha: '' })}
        usuario={modalSenhaGerada.usuario}
        senhaGerada={modalSenhaGerada.senha}
      />
    </div>
  )
}

export default AdminView