import { supabase } from '../../infra/supabase'

export const loginUsuario = async (email, senha) => {
  try {
    // 1. Fazer login no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (authError) throw authError

    // 2. Buscar o perfil do usuário na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      // Se não encontrou perfil, fazer logout e dar erro
      await supabase.auth.signOut()
      throw new Error('Usuário não encontrado no sistema')
    }

    return { user: authData.user, profile: userData }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const cadastrarUsuario = async (dadosUsuario) => {
  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dadosUsuario.email,
      password: dadosUsuario.senha
    })

    if (authError) throw authError

    // 2. Criar perfil na tabela usuarios (SEM senha)
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        nome: dadosUsuario.nome,
        email: dadosUsuario.email,
        tipo: dadosUsuario.tipo,
        telefone: dadosUsuario.telefone || null,
        cpf: dadosUsuario.cpf || null,
        crm: dadosUsuario.crm || null,
        especialidade: dadosUsuario.especialidade || null,
        status: dadosUsuario.tipo === 'medico' ? 'offline' : null
      }])
      .select()
      .single()

    if (userError) throw userError

    return { user: authData.user, profile: userData }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export const obterUsuarioAtual = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}
