import React, { useState } from 'react'
import Modal from './Modal'

const SenhaGeradaModal = ({ isOpen, onClose, usuario, senhaGerada }) => {
  const [copiado, setCopiado] = useState(false)

  const copiarSenha = async () => {
    try {
      await navigator.clipboard.writeText(senhaGerada)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar senha:', error)
    }
  }

  const copiarCredenciais = async () => {
    const credenciais = `E-mail: ${usuario?.email}\nSenha: ${senhaGerada}`
    try {
      await navigator.clipboard.writeText(credenciais)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar credenciais:', error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Usuário Criado com Sucesso"
      size="md"
      hideCloseButton={false}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {usuario?.tipo?.charAt(0).toUpperCase() + usuario?.tipo?.slice(1)} criado(a) com sucesso!
        </h3>
        
        <p className="text-gray-600 mb-6">
          <strong>{usuario?.nome}</strong> foi adicionado ao sistema.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Credenciais de acesso:</h4>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">E-mail:</span>
              <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {usuario?.email}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Senha:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono bg-white px-2 py-1 rounded border font-bold text-blue-600">
                  {senhaGerada}
                </span>
                <button
                  onClick={copiarSenha}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copiar senha"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Importante!
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>• Anote ou copie estas credenciais</p>
                <p>• A senha não será exibida novamente</p>
                <p>• O usuário pode alterar a senha após o primeiro login</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={copiarCredenciais}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>{copiado ? 'Copiado!' : 'Copiar Credenciais'}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default SenhaGeradaModal