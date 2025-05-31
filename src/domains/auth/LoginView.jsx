import React, { useState } from 'react'
import { useAuth } from './useAuth'

const LoginView = () => {
  const [modoAtual, setModoAtual] = useState('login') // 'login' | 'cadastro'
  const [tipoSelecionado, setTipoSelecionado] = useState('paciente') // só para cadastro
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [dadosCadastro, setDadosCadastro] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    crm: '',
    especialidade: ''
  })

  const { fazerLogin, fazerCadastro, carregando, erro } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await fazerLogin(email, senha)
    } catch (error) {
      console.error('Erro no login:', error.message)
    }
  }

  const handleCadastro = async (e) => {
    e.preventDefault()
    try {
      await fazerCadastro({
        email,
        senha,
        tipo: tipoSelecionado,
        ...dadosCadastro
      })
    } catch (error) {
      console.error('Erro no cadastro:', error.message)
    }
  }

  const alterarDadoCadastro = (campo, valor) => {
    setDadosCadastro(prev => ({ ...prev, [campo]: valor }))
  }

  const limparFormulario = () => {
    setEmail('')
    setSenha('')
    setDadosCadastro({
      nome: '',
      telefone: '',
      cpf: '',
      crm: '',
      especialidade: ''
    })
  }

  const alternarModo = (novoModo) => {
    setModoAtual(novoModo)
    limparFormulario()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Teleatendimento</h1>
          <p className="text-gray-600 mt-2">
            {modoAtual === 'login' ? 'Faça seu login' : 'Criar nova conta'}
          </p>
        </div>

        {/* Alternador Login/Cadastro */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => alternarModo('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              modoAtual === 'login'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => alternarModo('cadastro')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              modoAtual === 'cadastro'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* FORMULÁRIO DE LOGIN */}
        {modoAtual === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {erro && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        {modoAtual === 'cadastro' && (
          <>
            {/* Seletor de Tipo (só no cadastro) */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              {['paciente', 'medico', 'admin'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoSelecionado(tipo)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                    tipoSelecionado === tipo
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={dadosCadastro.nome}
                  onChange={(e) => alterarDadoCadastro('nome', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              {/* Campos específicos por tipo */}
              {tipoSelecionado === 'paciente' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={dadosCadastro.telefone}
                      onChange={(e) => alterarDadoCadastro('telefone', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={dadosCadastro.cpf}
                      onChange={(e) => alterarDadoCadastro('cpf', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {tipoSelecionado === 'medico' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CRM *
                    </label>
                    <input
                      type="text"
                      placeholder="123456/SP"
                      value={dadosCadastro.crm}
                      onChange={(e) => alterarDadoCadastro('crm', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidade *
                    </label>
                    <select
                      value={dadosCadastro.especialidade}
                      onChange={(e) => alterarDadoCadastro('especialidade', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="Clínica Geral">Clínica Geral</option>
                      <option value="Cardiologia">Cardiologia</option>
                      <option value="Dermatologia">Dermatologia</option>
                      <option value="Pediatria">Pediatria</option>
                      <option value="Psiquiatria">Psiquiatria</option>
                    </select>
                  </div>
                </>
              )}

              {erro && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? 'Criando conta...' : 'Cadastrar'}
              </button>
            </form>
          </>
        )}

        {/* Dica para usuários existentes */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {modoAtual === 'login' ? (
            <p>Sistema identifica automaticamente seu tipo de usuário</p>
          ) : (
            <p>Após cadastro, use apenas email e senha para login</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginView