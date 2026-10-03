import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import {
  CURRENCIES as FALLBACK_CURRENCIES,
  DEFAULT_CURRENCY,
  formatCompact,
  formatMoney,
  getCurrency,
} from '../assets/currencies'

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const { user } = useAuth()
  const [list, setList] = useState(FALLBACK_CURRENCIES)
  const [rates, setRates] = useState(null)

  // The user's saved currency wins; otherwise fall back to the last one they
  // picked on this device, then to the app default.
  const code =
    user?.currency ||
    localStorage.getItem('expensy_currency') ||
    DEFAULT_CURRENCY

  useEffect(() => {
    if (user?.currency) {
      localStorage.setItem('expensy_currency', user.currency)
    }
  }, [user?.currency])

  // Pull the live rate table once. Failure is fine — the static list stands.
  useEffect(() => {
    let cancelled = false
    api
      .get('/currencies')
      .then(({ data }) => {
        if (cancelled) return
        if (Array.isArray(data?.currencies) && data.currencies.length) {
          setList(data.currencies)
        }
        if (data?.rates) setRates(data.rates)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const meta = useMemo(
    () => list.find((c) => c.code === code) || getCurrency(code),
    [list, code]
  )

  const format = useCallback(
    (amount, options) => formatMoney(amount, code, options),
    [code]
  )

  const compact = useCallback((amount) => formatCompact(amount, code), [code])

  /** Convert between any two currencies using the rate table (via USD). */
  const convert = useCallback(
    (amount, from, to = code) => {
      if (!from || from === to) return Number(amount) || 0
      const table = rates?.rates
      if (!table?.[from] || !table?.[to]) return Number(amount) || 0
      return ((Number(amount) || 0) / table[from]) * table[to]
    },
    [rates, code]
  )

  const value = useMemo(
    () => ({
      code,
      symbol: meta?.symbol ?? 'Rs',
      meta,
      currencies: list,
      rates,
      format,
      compact,
      convert,
    }),
    [code, meta, list, rates, format, compact, convert]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used inside a CurrencyProvider')
  }
  return context
}