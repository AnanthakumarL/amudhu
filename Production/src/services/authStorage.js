const KEY = 'production_user'

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setStoredUser = (user) => {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export const clearStoredUser = () => {
  localStorage.removeItem(KEY)
}

export const isLoggedIn = () => {
  const user = getStoredUser()
  return Boolean(user?.id)
}
