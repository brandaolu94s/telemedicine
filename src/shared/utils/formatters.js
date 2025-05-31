export const formatarCPF = (cpf) => {
  const apenasNumeros = cpf.replace(/\D/g, '')
  if (apenasNumeros.length <= 11) {
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

export const formatarTelefone = (telefone) => {
  const apenasNumeros = telefone.replace(/\D/g, '')
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (apenasNumeros.length === 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return telefone
}

export const formatarCRM = (crm) => {
  return crm.toUpperCase().replace(/[^A-Z0-9\/]/g, '')
}

export const formatarData = (dataString, incluirHora = true) => {
  const opcoes = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }

  if (incluirHora) {
    opcoes.hour = '2-digit'
    opcoes.minute = '2-digit'
  }

  return new Date(dataString).toLocaleDateString('pt-BR', opcoes)
}

export const formatarDuracao = (dataInicio, dataFim) => {
  if (!dataFim) return 'Em andamento'
  
  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)
  const minutos = Math.round((fim - inicio) / (1000 * 60))
  
  if (minutos < 60) return `${minutos} min`
  
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  return `${horas}h ${mins > 0 ? `${mins}min` : ''}`
}

export const gerarSenhaAleatoria = (tamanho = 8) => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let senha = ''
  
  for (let i = 0; i < tamanho; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  
  return senha
}