// Form field rules shared by Register and Profile.
// Each checker returns an error message, or null if the value is fine.

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 20

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s+()-]{6,20}$/

export function checkRequired(value) {
  return value?.trim() ? null : 'Required'
}

export function checkName(value) {
  return checkRequired(value)
}

export function checkUsername(value) {
  if (!value?.trim()) return 'Required'
  if (value.trim().length < 3) return 'At least 3 characters'
  return null
}

export function checkEmail(value) {
  if (!value?.trim()) return 'Required'
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address'
  return null
}

export function checkPassword(value) {
  if (!value) return 'Required'
  if (value.length < PASSWORD_MIN) return `At least ${PASSWORD_MIN} characters`
  if (value.length > PASSWORD_MAX) return `At most ${PASSWORD_MAX} characters`
  return null
}

export function checkPasswordMatch(password, confirmation) {
  if (!password) return null
  return confirmation === password ? null : 'Passwords do not match'
}

// Optional, but must look like a phone number if filled
export function checkPhone(value) {
  if (!value?.trim()) return null
  return PHONE_RE.test(value.trim()) ? null : 'Digits, spaces and + ( ) - only'
}

// Optional, but cannot be in the future
export function checkDateOfBirth(value) {
  if (!value) return null
  return new Date(value) > new Date() ? 'Date cannot be in the future' : null
}

// Keeps only the failures, so callers can check Object.keys().length
export function collectErrors(checks) {
  return Object.fromEntries(
    Object.entries(checks).filter(([, message]) => message)
  )
}
