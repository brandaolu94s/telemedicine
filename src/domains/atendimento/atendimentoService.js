import { supabase } from '../../infra/supabase'
import { socketService } from '../../infra/socket'

export const aceitarPaciente = async (medicoId, pacienteId, filaId) => {
  try {
    // Atualizar status do médico para ocupado
    const { error: medicoError } = await supabase
      .from('usuarios')
      .update({ status: 'ocupado' })
      .eq('id', medicoId)

    if (medicoError) throw medicoError

    // Atualizar fila - paciente em atendimento
    const { error: filaError } = await supabase
      .from('fila')
      .update({ status: 'em_atendimento' })
      .eq('id', filaId)

    if (filaError) throw filaError

    // Criar registro de atendimento
    const { data: atendimento, error: atendimentoError } = await supabase
      .from('atendimentos')
      .insert([{
        paciente_id: pacienteId,
        medico_id: medicoId,
        status: 'em_andamento',
        tipo: 'consulta'
      }])
      .select()
      .single()

    if (atendimentoError) throw atendimentoError

    // Criar ID único para o atendimento (para WebRTC)
    const atendimentoId = `${medicoId}-${pacienteId}-${atendimento.id}`

    // Notificar via WebSocket
    socketService.emitirAceitarPaciente({
      pacienteId,
      medicoId,
      atendimentoId: atendimentoId,
      status: 'aceito'
    })

    return { ...atendimento, atendimentoId }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const recusarPaciente = async (medicoId, pacienteId, filaId) => {
  try {
    // Notificar via WebSocket que foi recusado
    socketService.emitirRecusarPaciente({
      pacienteId,
      medicoId,
      filaId,
      status: 'recusado'
    })

    // A fila continua - outro médico pode aceitar
    return { status: 'recusado' }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const finalizarAtendimento = async (atendimentoId, medicoId) => {
  try {
    // Extrair ID real do atendimento (remover prefixos)
    const realAtendimentoId = atendimentoId.split('-')[2]

    // Finalizar atendimento
    const { error: atendimentoError } = await supabase
      .from('atendimentos')
      .update({ 
        status: 'finalizado',
        data_fim: new Date().toISOString()
      })
      .eq('id', realAtendimentoId)

    if (atendimentoError) throw atendimentoError

    // Voltar médico para online
    const { error: medicoError } = await supabase
      .from('usuarios')
      .update({ status: 'online' })
      .eq('id', medicoId)

    if (medicoError) throw medicoError

    // Obter dados do atendimento para remover da fila
    const { data: atendimentoData } = await supabase
      .from('atendimentos')
      .select('paciente_id')
      .eq('id', realAtendimentoId)
      .single()

    if (atendimentoData) {
      // Remover paciente da fila
      const { error: filaError } = await supabase
        .from('fila')
        .update({ status: 'finalizado' })
        .eq('paciente_id', atendimentoData.paciente_id)

      if (filaError) console.error('Erro ao finalizar fila:', filaError)
    }

    return { status: 'finalizado' }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterProximoPaciente = async () => {
  try {
    const { data, error } = await supabase
      .from('fila')
      .select(`
        id,
        paciente_id,
        tipo_atendimento,
        posicao,
        criado_em,
        usuarios!paciente_id (nome, telefone)
      `)
      .eq('status', 'aguardando')
      .order('posicao')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    return null
  }
}