import api from './api'

/** Health score, ranked insights, forecast and budget suggestions in one call. */
export const getInsights = async () => {
  const { data } = await api.get('/ai/insights')
  return data
}

export const getHealthScore = async () => {
  const { data } = await api.get('/ai/health-score')
  return data
}

export const getForecast = async () => {
  const { data } = await api.get('/ai/forecast')
  return data
}