/**
 * Validadores reutilizáveis para formulários
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, error: "Email é obrigatório" };
  if (!emailRegex.test(email)) return { isValid: false, error: "Email inválido" };
  return { isValid: true };
}

// Telefone
export function validatePhone(phone: string): ValidationResult {
  const phoneRegex = /^(\+\d{1,3})?[\s.-]?\(?(\d{2,3})\)?[\s.-]?(\d{4,5})[\s.-]?(\d{4})$/;
  if (!phone) return { isValid: false, error: "Telefone é obrigatório" };
  if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
    return { isValid: false, error: "Telefone inválido" };
  }
  return { isValid: true };
}

// Senha
export function validatePassword(password: string): ValidationResult {
  if (!password) return { isValid: false, error: "Senha é obrigatória" };
  if (password.length < 6) return { isValid: false, error: "Senha deve ter pelo menos 6 caracteres" };
  return { isValid: true };
}

// Confirmação de senha
export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  if (password !== confirm) return { isValid: false, error: "Senhas não conferem" };
  return { isValid: true };
}

// Campo obrigatório
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  return { isValid: true };
}

// Comprimento mínimo
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  if (value.length < minLength) {
    return { isValid: false, error: `${fieldName} deve ter pelo menos ${minLength} caracteres` };
  }
  return { isValid: true };
}

// Comprimento máximo
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (value.length > maxLength) {
    return { isValid: false, error: `${fieldName} não pode ter mais de ${maxLength} caracteres` };
  }
  return { isValid: true };
}

// Número
export function validateNumber(value: string, fieldName: string): ValidationResult {
  if (!value) return { isValid: false, error: `${fieldName} é obrigatório` };
  if (isNaN(Number(value))) {
    return { isValid: false, error: `${fieldName} deve ser um número` };
  }
  return { isValid: true };
}

// Data
export function validateDate(value: string): ValidationResult {
  if (!value) return { isValid: false, error: "Data é obrigatória" };
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: "Data inválida" };
  }
  return { isValid: true };
}

// Data futura
export function validateFutureDate(value: string): ValidationResult {
  const dateValidation = validateDate(value);
  if (!dateValidation.isValid) return dateValidation;

  const date = new Date(value);
  const now = new Date();
  if (date <= now) {
    return { isValid: false, error: "Data deve ser no futuro" };
  }
  return { isValid: true };
}

// Data passada
export function validatePastDate(value: string): ValidationResult {
  const dateValidation = validateDate(value);
  if (!dateValidation.isValid) return dateValidation;

  const date = new Date(value);
  const now = new Date();
  if (date >= now) {
    return { isValid: false, error: "Data deve ser no passado" };
  }
  return { isValid: true };
}

// URL
export function validateURL(url: string): ValidationResult {
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "URL inválida" };
  }
}

// CPF
export function validateCPF(cpf: string): ValidationResult {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) {
    return { isValid: false, error: "CPF deve ter 11 dígitos" };
  }
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, error: "CPF inválido" };
  }
  return { isValid: true };
}

// CNPJ
export function validateCNPJ(cnpj: string): ValidationResult {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  if (cleanCNPJ.length !== 14) {
    return { isValid: false, error: "CNPJ deve ter 14 dígitos" };
  }
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return { isValid: false, error: "CNPJ inválido" };
  }
  return { isValid: true };
}

// Validador genérico
export function validate(
  value: string,
  rules: Array<(value: string) => ValidationResult>
): ValidationResult {
  for (const rule of rules) {
    const result = rule(value);
    if (!result.isValid) return result;
  }
  return { isValid: true };
}
