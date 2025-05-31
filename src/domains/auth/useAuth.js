import { useState, useEffect, createContext, useContext } from 'react'
import { loginUsuario, cadastrarUsuario, logout, obterUsuarioAtual } from './authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const fazerLogin = async (email, senha) => {
    try {
      setCarregando(true)
      setErro(null)
      
      console.log('🔐 Tentando login para:', email)
      const dadosUsuario = await loginUsuario(email, senha)
      
      console.log('✅ Login bem-sucedido:', {
        email: dadosUsuario.profile?.email,
        tipo: dadosUsuario.profile?.tipo,
        nome: dadosUsuario.profile?.nome
      })
      
      setUsuario(dadosUsuario)
      return dadosUsuario
    } catch (error) {
      console.error('❌ Erro no login:', error.message)
      setErro(error.message)
      throw error
    } finally {
      setCarregando(false)
    }
  }

  const fazerCadastro = async (dadosUsuario) => {
    try {
      setCarregando(true)
      setErro(null)
      
      console.log('📝 Criando usuário:', dadosUsuario.email, dadosUsuario.tipo)
      const novoUsuario = await cadastrarUsuario(dadosUsuario)
      
      console.log('✅ Cadastro bem-sucedido:', novoUsuario.profile?.email)
      setUsuario(novoUsuario)
      return novoUsuario
    } catch (error) {
      console.error('❌ Erro no cadastro:', error.message)
      setErro(error.message)
      throw error
    } finally {
      setCarregando(false)
    }
  }

  const fazerLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...')
      await logout()
      setUsuario(null)
      setErro(null)
    } catch (error) {
      console.error('❌ Erro no logout:', error.message)
      setErro(error.message)
    }
  }

  const verificarSessao = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      console.log('🔍 Verificando sessão...')
      const dadosUsuario = await obterUsuarioAtual()
      
      if (dadosUsuario) {
        console.log('✅ Sessão encontrada:', {
          email: dadosUsuario.profile?.email,
          tipo: dadosUsuario.profile?.tipo
        })
        setUsuario(dadosUsuario)
      } else {
        console.log('ℹ️ Nenhuma sessão ativa')
        setUsuario(null)
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error.message)
      setErro(error.message)
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    verificarSessao()
  }, [])

  const value = {
    usuario,
    carregando,
    erro,
    fazerLogin,
    fazerCadastro,
    fazerLogout,
    estaLogado: !!usuario && !!usuario.profile,
    tipoUsuario: usuario?.profile?.tipo || null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}