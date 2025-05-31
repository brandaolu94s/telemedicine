import { supabase } from '../../infra/supabase'

export const atualizarStatusMedico = async (medicoId, novoStatus) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ status: novoStatus })
      .eq('id', medicoId)
      .eq('tipo', 'medico')
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterStatusMedico = async (medicoId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('status')
      .eq('id', medicoId)
      .eq('tipo', 'medico')
      .single()

    if (error) throw error
    return data.status
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
      .in('status', ['online', 'ocupado', 'pausa'])
      .order('nome')

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterEstatisticasMedico = async (medicoId) => {
  try {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('id, data_inicio, data_fim, status')
      .eq('medico_id', medicoId)
      .eq('status', 'finalizado')

    if (error) throw error

    const totalAtendimentos = data.length
    const atendimentosHoje = data.filter(atendimento => {
      const hoje = new Date().toDateString()
      const dataAtendimento = new Date(atendimento.data_inicio).toDateString()
      return hoje === dataAtendimento
    }).length

    return {
      totalAtendimentos,
      atendimentosHoje,
      ultimosAtendimentos: data.slice(-5).reverse()
    }
  } catch (error) {
    throw new Error(error.message)
  }
}