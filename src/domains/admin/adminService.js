import { supabase } from '../../infra/supabase'
import { 
  criarUsuarioCompleto, 
  atualizarUsuarioCompleto, 
  excluirUsuarioCompleto,
  gerarSenhaTemporaria 
} from '../../infra/supabaseAdmin'

// ====================== MÉDICOS ======================
export const obterTodosMedicos = async (filtros = {}) => {
  try {
    let query = supabase
      .from('usuarios')
      .select('*')
      .eq('tipo', 'medico')
      .order('nome')

    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros.especialidade) {
      query = query.ilike('especialidade', `%${filtros.especialidade}%`)
    }

    if (filtros.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,crm.ilike.%${filtros.busca}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const criarMedico = async (dadosMedico) => {
  try {
    // Gerar senha se não fornecida
    const senha = dadosMedico.senha || gerarSenhaTemporaria()
    
    const dadosCompletos = {
      ...dadosMedico,
      senha,
      tipo: 'medico'
    }

    const resultado = await criarUsuarioCompleto(dadosCompletos)
    
    // Retornar com a senha gerada (para mostrar ao admin)
    return {
      ...resultado.profile,
      senhaGerada: senha
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const atualizarMedico = async (medicoId, dadosAtualizados) => {
  try {
    // Remover senha vazia para não tentar atualizar
    const dados = { ...dadosAtualizados }
    if (!dados.senha || dados.senha.trim() === '') {
      delete dados.senha
    }

    const data = await atualizarUsuarioCompleto(medicoId, dados)
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const excluirMedico = async (medicoId) => {
  try {
    await excluirUsuarioCompleto(medicoId)
  } catch (error) {
    throw new Error(error.message)
  }
}

// ====================== PACIENTES ======================
export const obterTodosPacientes = async (filtros = {}) => {
  try {
    let query = supabase
      .from('usuarios')
      .select('*')
      .eq('tipo', 'paciente')
      .order('nome')

    if (filtros.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const criarPaciente = async (dadosPaciente) => {
  try {
    // Gerar senha se não fornecida
    const senha = dadosPaciente.senha || gerarSenhaTemporaria()
    
    const dadosCompletos = {
      ...dadosPaciente,
      senha,
      tipo: 'paciente'
    }

    const resultado = await criarUsuarioCompleto(dadosCompletos)
    
    // Retornar com a senha gerada
    return {
      ...resultado.profile,
      senhaGerada: senha
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

export const atualizarPaciente = async (pacienteId, dadosAtualizados) => {
  try {
    // Remover senha vazia
    const dados = { ...dadosAtualizados }
    if (!dados.senha || dados.senha.trim() === '') {
      delete dados.senha
    }

    const data = await atualizarUsuarioCompleto(pacienteId, dados)
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

export const excluirPaciente = async (pacienteId) => {
  try {
    await excluirUsuarioCompleto(pacienteId)
  } catch (error) {
    throw new Error(error.message)
  }
}

// ====================== ATENDIMENTOS ======================
export const obterTodosAtendimentos = async (filtros = {}) => {
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
      .order('data_inicio', { ascending: false })

    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros.dataInicio) {
      query = query.gte('data_inicio', filtros.dataInicio)
    }

    if (filtros.dataFim) {
      query = query.lte('data_inicio', filtros.dataFim)
    }

    if (filtros.medicoId) {
      query = query.eq('medico_id', filtros.medicoId)
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    throw new Error(error.message)
  }
}

// ====================== ESTATÍSTICAS ======================
export const obterEstatisticasGerais = async () => {
  try {
    // Médicos por status
    const { data: medicos } = await supabase
      .from('usuarios')
      .select('status')
      .eq('tipo', 'medico')

    // Total de pacientes
    const { count: totalPacientes } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'paciente')

    // Atendimentos hoje
    const hoje = new Date().toDateString()
    const { data: atendimentosHoje } = await supabase
      .from('atendimentos')
      .select('status')
      .gte('data_inicio', new Date(hoje).toISOString())

    // Fila atual
    const { count: filaAtual } = await supabase
      .from('fila')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aguardando')

    // Atendimentos últimos 30 dias
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
    
    const { data: atendimentosMes } = await supabase
      .from('atendimentos')
      .select('data_inicio, status')
      .gte('data_inicio', trintaDiasAtras.toISOString())

    // Processar dados
    const medicosOnline = medicos?.filter(m => m.status === 'online').length || 0
    const medicosOcupados = medicos?.filter(m => m.status === 'ocupado').length || 0
    const medicosTotal = medicos?.length || 0

    const atendimentosFinalizadosHoje = atendimentosHoje?.filter(a => a.status === 'finalizado').length || 0
    const atendimentosEmAndamentoHoje = atendimentosHoje?.filter(a => a.status === 'em_andamento').length || 0

    const atendimentosFinalizadosMes = atendimentosMes?.filter(a => a.status === 'finalizado').length || 0

    return {
      medicos: {
        total: medicosTotal,
        online: medicosOnline,
        ocupados: medicosOcupados,
        offline: medicosTotal - medicosOnline - medicosOcupados
      },
      pacientes: {
        total: totalPacientes || 0
      },
      atendimentos: {
        hoje: {
          finalizados: atendimentosFinalizadosHoje,
          emAndamento: atendimentosEmAndamentoHoje,
          total: (atendimentosHoje?.length || 0)
        },
        mes: {
          finalizados: atendimentosFinalizadosMes,
          total: (atendimentosMes?.length || 0)
        }
      },
      fila: {
        atual: filaAtual || 0
      }
    }
  } catch (error) {
    throw new Error(error.message)
  }
}
