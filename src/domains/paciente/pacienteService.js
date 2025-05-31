import { supabase } from '../../infra/supabase'

export const entrarNaFila = async (pacienteId, tipoAtendimento = 'geral') => {
  try {
    // Verifica se já está na fila
    const { data: filaExistente } = await supabase
      .from('fila')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('status', 'aguardando')
      .single()

    if (filaExistente) {
      throw new Error('Você já está na fila de atendimento')
    }

    // Calcula a próxima posição
    const { count } = await supabase
      .from('fila')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aguardando')

    const { data, error } = await supabase
      .from('fila')
      .insert([{
        paciente_id: pacienteId,
        tipo_atendimento: tipoAtendimento,
        status: 'aguardando',
        posicao: (count || 0) + 1
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const sairDaFila = async (pacienteId) => {
  try {
    const { error } = await supabase
      .from('fila')
      .delete()
      .eq('paciente_id', pacienteId)
      .eq('status', 'aguardando')

    if (error) throw error
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterPosicaoNaFila = async (pacienteId) => {
  try {
    const { data, error } = await supabase
      .from('fila')
      .select(`
        id,
        posicao,
        tipo_atendimento,
        status,
        criado_em,
        usuarios!paciente_id (nome)
      `)
      .eq('paciente_id', pacienteId)
      .eq('status', 'aguardando')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterFilaCompleta = async () => {
  try {
    const { data, error } = await supabase
      .from('fila')
      .select(`
        id,
        posicao,
        tipo_atendimento,
        status,
        criado_em,
        usuarios!paciente_id (nome)
      `)
      .eq('status', 'aguardando')
      .order('posicao')

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterMedicosDisponiveis = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, especialidade, status')
      .eq('tipo', 'medico')
      .in('status', ['online'])
      .order('nome')

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterHistoricoAtendimentos = async (pacienteId) => {
  try {
    const { data, error } = await supabase
      .from('atendimentos')
      .select(`
        id,
        data_inicio,
        data_fim,
        tipo,
        status,
        usuarios!medico_id (nome, especialidade)
      `)
      .eq('paciente_id', pacienteId)
      .eq('status', 'finalizado')
      .order('data_inicio', { ascending: false })
      .limit(10)

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}