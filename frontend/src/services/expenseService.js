import api from './api'

// ---------------- Expenses ----------------

export const getExpenses = async (params = {}) => {
  const { data } = await api.get('/expenses/', { params })
  return data
}

export const addExpense = async (payload) => {
  const { data } = await api.post('/expenses/', payload)
  return data
}

export const updateExpense = async (id, payload) => {
  const { data } = await api.put(`/expenses/${id}`, payload)
  return data
}

export const deleteExpense = async (id) => {
  const { data } = await api.delete(`/expenses/${id}`)
  return data
}

// ---------------- Income ----------------

export const getIncome = async (params = {}) => {
  const { data } = await api.get('/income/', { params })
  return data
}

export const addIncome = async (payload) => {
  const { data } = await api.post('/income/', payload)
  return data
}

export const updateIncome = async (id, payload) => {
  const { data } = await api.put(`/income/${id}`, payload)
  return data
}

export const deleteIncome = async (id) => {
  const { data } = await api.delete(`/income/${id}`)
  return data
}

// ---------------- Analytics ----------------

export const getSummary = async () => {
  const { data } = await api.get('/analytics/summary')
  return data
}

export const getCategoryBreakdown = async () => {
  const { data } = await api.get('/analytics/category-breakdown')
  return data
}

export const getMonthlyTrend = async (months = 12) => {
  const { data } = await api.get('/analytics/monthly-trend', { params: { months } })
  return data
}

export const getDailyTrend = async (days = 30) => {
  const { data } = await api.get('/analytics/daily-trend', { params: { days } })
  return data
}