import { supabase } from '../../infra/supabase'

export const obterHistoricoMedico = async (medicoId, filtros = {}) => {
  try {
    let query = supabase
      .from('atendimentos')
      .select(`
        id,
        data_inicio,
        data_fim,
        tipo,
        status,
        criado_em,
        usuarios!paciente_id (
          nome,
          telefone,
          cpf
        )
      `)
      .eq('medico_id', medicoId)
      .order('data_inicio', { ascending: false })

    // Aplicar filtros
    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros.dataInicio) {
      query = query.gte('data_inicio', filtros.dataInicio)
    }

    if (filtros.dataFim) {
      query = query.lte('data_inicio', filtros.dataFim)
    }

    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite)
    }

    const { data, error } = await query

    if (error) throw error

    // Calcular estatísticas
    const totalAtendimentos = data.length
    const atendimentosFinalizados = data.filter(a => a.status === 'finalizado').length
    const tempoMedioAtendimento = calcularTempoMedio(data.filter(a => a.data_fim))

    return {
      atendimentos: data,
      estatisticas: {
        totalAtendimentos,
        atendimentosFinalizados,
        tempoMedioAtendimento,
        taxaConclusao: totalAtendimentos > 0 ? (atendimentosFinalizados / totalAtendimentos * 100).toFixed(1) : 0
      }
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterHistoricoPaciente = async (pacienteId, filtros = {}) => {
  try {
    let query = supabase
      .from('atendimentos')
      .select(`
        id,
        data_inicio,
        data_fim,
        tipo,
        status,
        criado_em,
        usuarios!medico_id (
          nome,
          especialidade,
          crm
        )
      `)
      .eq('paciente_id', pacienteId)
      .order('data_inicio', { ascending: false })

    // Aplicar filtros
    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros.dataInicio) {
      query = query.gte('data_inicio', filtros.dataInicio)
    }

    if (filtros.dataFim) {
      query = query.lte('data_inicio', filtros.dataFim)
    }

    if (filtros.especialidade) {
      query = query.eq('usuarios.especialidade', filtros.especialidade)
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite)
    }

    const { data, error } = await query

    if (error) throw error

    // Calcular estatísticas
    const totalAtendimentos = data.length
    const atendimentosFinalizados = data.filter(a => a.status === 'finalizado').length
    const especialidadesMaisUsadas = calcularEspecialidadesMaisUsadas(data)

    return {
      atendimentos: data,
      estatisticas: {
        totalAtendimentos,
        atendimentosFinalizados,
        especialidadesMaisUsadas,
        ultimoAtendimento: data[0] || null
      }
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterDetalhesAtendimento = async (atendimentoId, usuarioId, tipoUsuario) => {
  try {
    const { data, error } = await supabase
      .from('atendimentos')
      .select(`
        id,
        data_inicio,
        data_fim,
        tipo,
        status,
        criado_em,
        paciente:usuarios!paciente_id (
          nome,
          telefone,
          cpf
        ),
        medico:usuarios!medico_id (
          nome,
          especialidade,
          crm
        )
      `)
      .eq('id', atendimentoId)
      .single()

    if (error) throw error

    // Verificar se o usuário tem permissão para ver este atendimento
    const temPermissao = tipoUsuario === 'admin' ||
      (tipoUsuario === 'medico' && data.medico_id === usuarioId) ||
      (tipoUsuario === 'paciente' && data.paciente_id === usuarioId)

    if (!temPermissao) {
      throw new Error('Acesso negado a este atendimento')
    }

    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const obterEstatisticasGerais = async (medicoId = null, periodo = '30d') => {
  try {
    const dataInicio = calcularDataInicio(periodo)
    
    let query = supabase
      .from('atendimentos')
      .select('id, data_inicio, data_fim, status, tipo')
      .gte('data_inicio', dataInicio)

    if (medicoId) {
      query = query.eq('medico_id', medicoId)
    }

    const { data, error } = await query

    if (error) throw error

    const estatisticas = {
      totalAtendimentos: data.length,
      atendimentosFinalizados: data.filter(a => a.status === 'finalizado').length,
      atendimentosEmAndamento: data.filter(a => a.status === 'em_andamento').length,
      tempoMedioAtendimento: calcularTempoMedio(data.filter(a => a.data_fim)),
      atendimentosPorDia: agruparPorDia(data),
      tiposMaisComuns: agruparPorTipo(data)
    }

    return estatisticas
  } catch (error) {
    throw new Error(error.message)
  }
}

// Funções auxiliares
const calcularTempoMedio = (atendimentos) => {
  if (atendimentos.length === 0) return 0

  const tempos = atendimentos.map(a => {
    const inicio = new Date(a.data_inicio)
    const fim = new Date(a.data_fim)
    return (fim - inicio) / (1000 * 60) // minutos
  })

  return Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
}

const calcularEspecialidadesMaisUsadas = (atendimentos) => {
  const especialidades = {}
  
  atendimentos.forEach(a => {
    const esp = a.usuarios?.especialidade || 'Não especificada'
    especialidades[esp] = (especialidades[esp] || 0) + 1
  })

  return Object.entries(especialidades)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([nome, count]) => ({ nome, count }))
}

const calcularDataInicio = (periodo) => {
  const hoje = new Date()
  const diasAtras = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
  hoje.setDate(hoje.getDate() - diasAtras)
  return hoje.toISOString()
}

const agruparPorDia = (atendimentos) => {
  const grupos = {}
  
  atendimentos.forEach(a => {
    const dia = new Date(a.data_inicio).toDateString()
    grupos[dia] = (grupos[dia] || 0) + 1
  })

  return grupos
}

const agruparPorTipo = (atendimentos) => {
  const tipos = {}
  
  atendimentos.forEach(a => {
    const tipo = a.tipo || 'Não especificado'
    tipos[tipo] = (tipos[tipo] || 0) + 1
  })

  return Object.entries(tipos)
    .sort(([,a], [,b]) => b - a)
    .map(([nome, count]) => ({ nome, count }))
}