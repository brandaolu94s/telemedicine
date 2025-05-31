import { supabase } from '../infra/supabase'

// 🔍 Função para verificar se usuário existe no banco
export const verificarUsuarioNoBanco = async (email) => {
  try {
    console.log('🔍 Verificando usuário no banco:', email)
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
    
    if (error) {
      console.error('❌ Erro ao consultar banco:', error)
      return { erro: error.message }
    }
    
    console.log('✅ Resultado da consulta:', data)
    return { usuarios: data }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return { erro: error.message }
  }
}

// 🔍 Função para verificar se usuário existe no Auth
export const verificarUsuarioNoAuth = async () => {
  try {
    console.log('🔍 Verificando usuários no Auth...')
    
    // Esta função só funciona com service_role key
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Erro ao listar usuários do Auth:', error)
      return { erro: error.message }
    }
    
    console.log('✅ Usuários no Auth:', data.users)
    return { usuarios: data.users }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return { erro: error.message }
  }
}

// 🔧 Função para criar usuário admin de teste
export const criarAdminTeste = async () => {
  try {
    console.log('🔧 Criando usuário admin de teste...')
    
    const emailTeste = 'admin@teste.com'
    const senhaTeste = 'admin123'
    
    // 1. Criar no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailTeste,
      password: senhaTeste
    })
    
    if (authError) {
      console.error('❌ Erro ao criar no Auth:', authError)
      return { erro: authError.message }
    }
    
    console.log('✅ Usuário criado no Auth:', authData.user.id)
    
    // 2. Criar perfil na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        nome: 'Administrador Teste',
        email: emailTeste,
        tipo: 'admin'
      }])
      .select()
      .single()
    
    if (userError) {
      console.error('❌ Erro ao criar perfil:', userError)
      return { erro: userError.message }
    }
    
    console.log('✅ Perfil criado:', userData)
    
    return {
      sucesso: true,
      credenciais: {
        email: emailTeste,
        senha: senhaTeste
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return { erro: error.message }
  }
}

// 🧪 Função para testar login direto
export const testarLogin = async (email, senha) => {
  try {
    console.log('🧪 Testando login direto...', { email, senha })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })
    
    if (error) {
      console.error('❌ Erro no login:', error)
      return { erro: error.message }
    }
    
    console.log('✅ Login bem-sucedido:', data.user.email)
    
    // Fazer logout imediatamente
    await supabase.auth.signOut()
    
    return { sucesso: true, usuario: data.user }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return { erro: error.message }
  }
}

// 🔧 Função para resetar senha de usuário
export const resetarSenhaUsuario = async (email, novaSenha) => {
  try {
    console.log('🔧 Resetando senha para:', email)
    
    // Primeiro, buscar o usuário
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()
    
    if (!usuarios) {
      return { erro: 'Usuário não encontrado no banco' }
    }
    
    // Tentar atualizar senha (precisa de service_role)
    const { data, error } = await supabase.auth.admin.updateUserById(
      usuarios.id,
      { password: novaSenha }
    )
    
    if (error) {
      console.error('❌ Erro ao resetar senha:', error)
      return { erro: error.message }
    }
    
    console.log('✅ Senha resetada com sucesso')
    return { sucesso: true }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return { erro: error.message }
  }
}