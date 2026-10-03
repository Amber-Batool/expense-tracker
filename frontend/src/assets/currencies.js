// Kept in sync with backend/app/utils/currency.py.
// The backend is the source of truth for live rates; this list is what the
// picker renders and what we fall back to before /api/currencies responds.

export const CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', locale: 'en-PK', flag: '🇵🇰', decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', flag: '🇺🇸', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', flag: '🇪🇺', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', flag: '🇬🇧', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', locale: 'tr-TR', flag: '🇹🇷', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', locale: 'ko-KR', flag: '🇰🇷', decimals: 0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', flag: '🇮🇳', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵', decimals: 0 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', flag: '🇲🇾', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', flag: '🇨🇳', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', flag: '🇦🇪', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', locale: 'ar-SA', flag: '🇸🇦', decimals: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', locale: 'bn-BD', flag: '🇧🇩', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', locale: 'id-ID', flag: '🇮🇩', decimals: 0 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', locale: 'th-TH', flag: '🇹🇭', decimals: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', locale: 'en-PH', flag: '🇵🇭', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', flag: '🇸🇬', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA', flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', flag: '🇦🇺', decimals: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', locale: 'ar-EG', flag: '🇪🇬', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA', flag: '🇿🇦', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG', flag: '🇳🇬', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR', flag: '🇧🇷', decimals: 2 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', locale: 'ru-RU', flag: '🇷🇺', decimals: 2 },
]

export const DEFAULT_CURRENCY = 'PKR'

export const getCurrency = (code) =>
  CURRENCIES.find((c) => c.code === code) ||
  CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY)

/**
 * Format a number as money.
 *
 * Intl gives us the right separators and symbol placement per locale, which
 * matters — ₹1,23,456 in India, ₩123,456 in Korea, 123.456,78 € in Germany.
 * If a runtime doesn't know a currency we fall back to "SYM 1,234".
 */
export function formatMoney(amount, code = DEFAULT_CURRENCY, options = {}) {
  const meta = getCurrency(code)
  const value = Number(amount) || 0
  const { compact = false, showDecimals = false, signDisplay = 'auto' } = options

  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: showDecimals ? meta.decimals : 0,
      minimumFractionDigits: 0,
      signDisplay,
    }).format(value)
  } catch {
    const rounded = value.toLocaleString('en-US', {
      maximumFractionDigits: showDecimals ? meta.decimals : 0,
    })
    return `${meta.symbol} ${rounded}`
  }
}

/** Short form for chart axes: 12.4k, 1.2M */
export function formatCompact(amount, code = DEFAULT_CURRENCY) {
  return formatMoney(amount, code, { compact: true })
}