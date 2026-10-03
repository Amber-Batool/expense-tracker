
import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineCheck } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { formatMoney } from '../assets/currencies'
import { useCurrency } from '../context/CurrencyContext'
import { addIncome, updateIncome } from '../services/expenseService'
import CurrencySelect from './CurrencySelect'
import Modal from './Modal'

const SOURCE_SUGGESTIONS = ['Salary', 'Freelance', 'Business', 'Gift', 'Refund', 'Investment']

const toInputDate = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function IncomeForm({ onClose, onSaved, existing }) {
  const { code: baseCurrency, convert } = useCurrency()
  const isEdit = Boolean(existing)

  const [source, setSource] = useState(existing?.source || '')
  const [amount, setAmount] = useState(existing?.amount ?? '')
  const [currency, setCurrency] = useState(existing?.currency || baseCurrency)
  const [note, setNote] = useState(existing?.note || '')
  const [date, setDate] = useState(toInputDate(existing?.date))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const numericAmount = Number(amount)
  const showsConversion = currency !== baseCurrency && numericAmount > 0

  const validate = () => {
    const next = {}
    if (!source.trim()) next.source = 'Where did this money come from?'
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      next.amount = 'Enter an amount greater than zero.'
    }
    if (!date) next.date = 'Pick a date.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate() || saving) return

    setSaving(true)
    try {
      const payload = {
        source: source.trim(),
        amount: Number(numericAmount.toFixed(2)),
        currency,
        note: note.trim(),
        date: new Date(`${date}T12:00:00`).toISOString(),
      }

      const saved = isEdit
        ? await updateIncome(existing.id, payload)
        : await addIncome(payload)

      toast.success(isEdit ? 'Income updated' : 'Income added')
      await onSaved?.(saved)
      onClose()
    } catch (error) {
      toast.error(error.friendlyMessage || 'Could not save the income entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit income' : 'Add income'}
      subtitle={isEdit ? 'Change anything and save.' : 'Recording what comes in makes the balance mean something.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="income-source">Source</label>
          <input
            id="income-source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Salary"
            aria-invalid={Boolean(errors.source)}
          />
          {errors.source && <span className="field-error">{errors.source}</span>}
          <div className="suggestion-row">
            {SOURCE_SUGGESTIONS.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                className={`suggestion-chip${source === suggestion ? ' selected' : ''}`}
                onClick={() => setSource(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="income-amount">Amount</label>
            <div className="amount-input">
              <input
                id="income-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                aria-invalid={Boolean(errors.amount)}
              />
              <CurrencySelect value={currency} onChange={setCurrency} compact />
            </div>
            {errors.amount && <span className="field-error">{errors.amount}</span>}
            {showsConversion && (
              <motion.span className="field-hint" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                Saved as {formatMoney(convert(numericAmount, currency, baseCurrency), baseCurrency)} in your totals
              </motion.span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="income-date">Date</label>
            <input
              id="income-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={Boolean(errors.date)}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="income-note">Note</label>
          <input
            id="income-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional — anything you want to remember"
          />
        </div>

        <button type="submit" className="btn-primary auth-submit-btn" disabled={saving}>
          {saving ? <span className="spinner" /> : <><HiOutlineCheck /> {isEdit ? 'Save changes' : 'Add income'}</>}
        </button>
      </form>
    </Modal>
  )
}