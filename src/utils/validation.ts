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
  if (/^\s+$/.test(username)) return 'Username cannot be empty or contain only spaces'
  const trimmed = username.trim()
  if (trimmed.length < 3) return 'Username must be at least 3 characters'
  if (trimmed.length > 50) return 'Username cannot exceed 50 characters'
  if (username.includes(' ')) return 'No spaces allowed. Use letters, numbers, - or _'
  if (!/^[a-zA-Z0-9_-]+$/.test(username))
    return 'Only letters, numbers, - and _ allowed'
  return null
}

export const validateEmail = (email: string) => {
  const trimmed = email.trim()
  if (!trimmed) return 'Email is required'
  if (trimmed.length > 254) return 'Email too long'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return 'Please enter a valid email address'
  return null
}
