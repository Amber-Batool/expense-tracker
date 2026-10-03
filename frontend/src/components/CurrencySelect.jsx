import { useCurrency } from '../context/CurrencyContext'


export default function CurrencySelect({
  value,
  onChange,
  id = 'currency',
  className = '',
  compact = false,
  disabled = false,
}) {
  const { currencies, code } = useCurrency()
  const selected = value || code

  return (
    <select
      id={id}
      className={`currency-select${compact ? ' compact' : ''} ${className}`.trim()}
      value={selected}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Currency"
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {compact
            ? `${currency.flag || ''} ${currency.code}`.trim()
            : `${currency.flag || ''} ${currency.code} — ${currency.name}`.trim()}
        </option>
      ))}
    </select>
  )
}