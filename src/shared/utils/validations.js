export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validarCPF = (cpf) => {
  const apenasNumeros = cpf.replace(/\D/g, '')
  
  if (apenasNumeros.length !== 11) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(apenasNumeros)) return false
  
  // Validar primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(apenasNumeros.charAt(i)) * (10 - i)
  }
  let digito = 11 - (soma % 11)
  if (digito === 10 || digito === 11) digito = 0
  if (digito !== parseInt(apenasNumeros.charAt(9))) return false
  
  // Validar segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(apenasNumeros.charAt(i)) * (11 - i)
  }
  digito = 11 - (soma % 11)
  if (digito === 10 || digito === 11) digito = 0
  if (digito !== parseInt(apenasNumeros.charAt(10))) return false
  
  return true
}

export const validarTelefone = (telefone) => {
  const apenasNumeros = telefone.replace(/\D/g, '')
  return apenasNumeros.length >= 10 && apenasNumeros.length <= 11
}

export const validarCRM = (crm) => {
  // Formato básico: números seguidos de /UF
  const regex = /^\d{4,6}\/[A-Z]{2}$/
  return regex.test(crm.toUpperCase())
}

export const validarSenha = (senha, minimo = 6) => {
  return senha && senha.length >= minimo
}
