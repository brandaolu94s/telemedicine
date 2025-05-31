import React from 'react'
import { AuthProvider, useAuth } from '../domains/auth/useAuth'
import LoginView from '../domains/auth/LoginView'
import MedicoView from '../domains/medico/MedicoView'
import PacienteView from '../domains/paciente/PacienteView'
import AdminView from '../domains/admin/AdminView'

const AppContent = () => {
  const { estaLogado, carregando, usuario, tipoUsuario, fazerLogout } = useAuth()

  // Loading state
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não está logado, mostrar tela de login
  if (!estaLogado) {
    return <LoginView />
  }

  // Se está logado mas não tem tipo, mostrar erro
  if (!tipoUsuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">Perfil Incompleto</h2>
          <p className="text-gray-600 mb-4">
            Seu usuário não possui um tipo definido no sistema.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Usuário: {usuario?.profile?.nome || usuario?.user?.email}
            </p>
            <p className="text-sm text-gray-500">
              Tipo: {tipoUsuario || 'Não definido'}
            </p>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={fazerLogout}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Roteamento por tipo de usuário
  switch (tipoUsuario) {
    case 'medico':
      return <MedicoView />
    case 'paciente':
      return <PacienteView />
    case 'admin':
      return <AdminView />
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
            <div className="text-red-500 text-6xl mb-4">❓</div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">Tipo de usuário não reconhecido</h2>
            <p className="text-gray-600 mb-4">
              Tipo detectado: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tipoUsuario}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Entre em contato com o administrador para corrigir seu perfil.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={fazerLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Fazer Logout
              </button>
            </div>
          </div>
        </div>
      )
  }
}

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App