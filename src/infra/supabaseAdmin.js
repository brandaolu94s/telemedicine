import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scdraumllgzpdbyvbpei.supabase.co'

// 🔑 SERVICE ROLE KEY - Substitua pela sua chave real
// Para obter: Supabase Dashboard > Settings > API > service_role
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZHJhdW1sbGd6cGRieXZicGVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYyOTQzMiwiZXhwIjoyMDY0MjA1NDMyfQ.JW4ZS1LaFpdbqiYbgatE8_Gfm9uHgCqNEJjkzNIzVis' 

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 🔧 Funções administrativas
export const criarUsuarioCompleto = async (dadosUsuario) => {
  try {
    console.log('👑 Criando usuário com privilégios admin...')
    
    // 1. Criar no Auth usando service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dadosUsuario.email,
      password: dadosUsuario.senha,
      email_confirm: true
    })

    if (authError) {
      throw new Error(`Erro no Auth: ${authError.message}`)
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id)

    // 2. Criar perfil (SEM incluir senha)
    const { data: profileData, error: profileError } = await supabaseAdmin
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

    if (profileError) {
      // Se falhou, limpar o usuário do Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Erro ao criar perfil: ${profileError.message}`)
    }

    console.log('✅ Usuário completo criado:', profileData.tipo)
    return { user: authData.user, profile: profileData }

  } catch (error) {
    console.error('❌ Erro na criação administrativa:', error.message)
    throw error
  }
}

export const atualizarUsuarioCompleto = async (userId, dadosAtualizados) => {
  try {
    // 1. Atualizar perfil na tabela usuarios
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .update({
        nome: dadosAtualizados.nome,
        email: dadosAtualizados.email,
        telefone: dadosAtualizados.telefone || null,
        cpf: dadosAtualizados.cpf || null,
        crm: dadosAtualizados.crm || null,
        especialidade: dadosAtualizados.especialidade || null
      })
      .eq('id', userId)
      .select()
      .single()

    if (profileError) throw profileError

    // 2. Se tem nova senha, atualizar no Auth
    if (dadosAtualizados.senha) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          password: dadosAtualizados.senha,
          email: dadosAtualizados.email
        }
      )
      
      if (authError) {
        console.warn('Erro ao atualizar senha:', authError.message)
      }
    }

    return profileData
  } catch (error) {
    throw error
  }
}

export const excluirUsuarioCompleto = async (userId) => {
  try {
    // 1. Excluir do Auth primeiro
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.warn('Erro ao excluir do Auth:', authError.message)
    }

    // 2. Excluir perfil (pode dar erro se já foi deletado por cascata)
    const { error: profileError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.warn('Erro ao excluir perfil:', profileError.message)
    }

  } catch (error) {
    throw error
  }
}

export const gerarSenhaTemporaria = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}