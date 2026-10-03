


import api from './api'

export const signup = async (name, email, password, currency) => {
  const { data } = await api.post('/auth/signup', { name, email, password, currency })
  return data
}

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const getProfile = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

/** Send only what changed: { name } and/or { currency }. */
export const updateProfile = async (payload) => {
  const { data } = await api.put('/auth/me', payload)
  return data
}

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.put('/auth/password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return data
}

export const getCurrencies = async () => {
  const { data } = await api.get('/currencies')
  return data
}