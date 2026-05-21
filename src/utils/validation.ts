export const validateProjectName = (name: string) => {
  if (!name) return 'Project name is required'
  if (name.length > 30) return 'Max 30 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(name))
    return 'Only letters, numbers, - and _ allowed'
  return null
}

export const validateFileName = (name: string) => {
  if (!name) return 'File name is required'
  if (name.length < 3) return 'Min 3 characters including extension'
  if (name.length > 30) return 'Max 30 characters'
  if (!name.includes('.')) return 'Include a file extension (e.g. .py)'
  return null
}

export const validateUsername = (username: string) => {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 30) return 'Username cannot exceed 30 characters'
  if (username.includes(' ')) return 'No spaces allowed. Use letters, numbers, - or _'
  if (!/^[a-zA-Z0-9_-]+$/.test(username))
    return 'Only letters, numbers, - and _ allowed'
  return null
}

export const validateEmail = (email: string) => {
  if (!email) return 'Email is required'
  if (email.length > 254) return 'Email too long'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Enter a valid email address'
  return null
}

export const validatePassword = (password: string) => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 64) return 'Password cannot exceed 64 characters'
  return null
}

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%^&*]/.test(password)
  if (hasUpper && hasNumber && hasSymbol) return 'strong'
  if (hasUpper && hasNumber) return 'medium'
  return 'weak'
}
