import React, { useState } from 'react'

const FormPaciente = ({ paciente = null, onSubmit, onCancel, carregando = false }) => {
  const [dados, setDados] = useState({
    nome: paciente?.nome || '',
    email: paciente?.email || '',
    senha: '', // Sempre começa vazio
    telefone: paciente?.telefone || '',
    cpf: paciente?.cpf || ''
  })

  const [erros, setErros] = useState({})
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const validarFormulario = () => {
    const novosErros = {}

    if (!dados.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    }

    if (!dados.email.trim()) {
      novosErros.email = 'E-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(dados.email)) {
      novosErros.email = 'E-mail inválido'
    }

    // Para novos pacientes, senha é opcional
    if (!paciente && dados.senha && dados.senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres'
    }

    // Para edição, validar apenas se senha foi informada
    if (paciente && dados.senha && dados.senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (!dados.telefone.trim()) {
      novosErros.telefone = 'Telefone é obrigatório'
    }

    if (!dados.cpf.trim()) {
      novosErros.cpf = 'CPF é obrigatório'
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) return

    // Preparar dados para envio
    const dadosSubmit = { ...dados }
    
    // Se é edição e senha está vazia, remover do objeto
    if (paciente && !dados.senha.trim()) {
      delete dadosSubmit.senha
    }

    onSubmit(dadosSubmit)
  }

  const handleChange = (campo, valor) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
    
    if (erros[campo]) {
      setErros(prev => ({ ...prev, [campo]: '' }))
    }
  }

  const formatarCPF = (cpf) => {
    const apenasNumeros = cpf.replace(/\D/g, '')
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatarTelefone = (telefone) => {
    const apenasNumeros = telefone.replace(/\D/g, '')
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  const gerarSenhaAleatoria = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let senha = ''
    for (let i = 0; i < 8; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleChange('senha', senha)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo *
        </label>
        <input
          type="text"
          value={dados.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            erros.nome ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="João da Silva"
        />
        {erros.nome && <p className="text-red-500 text-sm mt-1">{erros.nome}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail *
        </label>
        <input
          type="email"
          value={dados.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            erros.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="joao@exemplo.com"
        />
        {erros.email && <p className="text-red-500 text-sm mt-1">{erros.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {paciente ? 'Nova senha (opcional)' : 'Senha (opcional - será gerada automaticamente)'}
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={dados.senha}
              onChange={(e) => handleChange('senha', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                erros.senha ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={paciente ? 'Digite para alterar' : 'Deixe vazio para gerar automaticamente'}
            />
            {dados.senha && (
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? '👁️' : '👁️‍🗨️'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={gerarSenhaAleatoria}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Gerar
          </button>
        </div>
        {erros.senha && <p className="text-red-500 text-sm mt-1">{erros.senha}</p>}
        {!paciente && (
          <p className="text-xs text-gray-500 mt-1">
            Se não informar uma senha, será gerada automaticamente e exibida após a criação
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone *
        </label>
        <input
          type="tel"
          value={dados.telefone}
          onChange={(e) => handleChange('telefone', formatarTelefone(e.target.value))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            erros.telefone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
        {erros.telefone && <p className="text-red-500 text-sm mt-1">{erros.telefone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CPF *
        </label>
        <input
          type="text"
          value={dados.cpf}
          onChange={(e) => handleChange('cpf', formatarCPF(e.target.value))}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            erros.cpf ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="000.000.000-00"
          maxLength={14}
        />
        {erros.cpf && <p className="text-red-500 text-sm mt-1">{erros.cpf}</p>}
      </div>

      <div className="flex space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={carregando}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando ? 'Salvando...' : (paciente ? 'Atualizar' : 'Criar paciente')}
        </button>
      </div>
    </form>
  )
}

export default FormPaciente