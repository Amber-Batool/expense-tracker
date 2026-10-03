
import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineCheck } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { CATEGORIES } from '../assets/categories'
import { formatMoney } from '../assets/currencies'
import { useCurrency } from '../context/CurrencyContext'
import { addExpense, updateExpense } from '../services/expenseService'
import CurrencySelect from './CurrencySelect'
import Modal from './Modal'

const toInputDate = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function ExpenseForm({ onClose, onSaved, existing }) {
  const { code: baseCurrency, convert } = useCurrency()
  const isEdit = Boolean(existing)

  const [title, setTitle] = useState(existing?.title || '')
  const [amount, setAmount] = useState(existing?.amount ?? '')
  const [currency, setCurrency] = useState(existing?.currency || baseCurrency)
  const [category, setCategory] = useState(existing?.category || 'Food')
  const [note, setNote] = useState(existing?.note || '')
  const [date, setDate] = useState(toInputDate(existing?.date))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const numericAmount = Number(amount)
  const showsConversion = currency !== baseCurrency && numericAmount > 0
  const activeCategory = CATEGORIES.find((item) => item.value === category) || CATEGORIES[0]

  const validate = () => {
    const next = {}
    if (!title.trim()) next.title = 'Give it a name so you recognise it later.'
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
        title: title.trim(),
        amount: Number(numericAmount.toFixed(2)),
        currency,
        category,
        note: note.trim(),
        date: new Date(`${date}T12:00:00`).toISOString(),
      }

      const saved = isEdit
        ? await updateExpense(existing.id, payload)
        : await addExpense(payload)

      toast.success(isEdit ? 'Expense updated' : 'Expense added')
      await onSaved?.(saved)
      onClose()
    } catch (error) {
      toast.error(error.friendlyMessage || 'Could not save the expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit expense' : 'Add expense'}
      subtitle={isEdit ? 'Change anything and save.' : 'Log it now so the numbers stay honest.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="expense-title">What was it for?</label>
          <input
            id="expense-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Grocery run"
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expense-amount">Amount</label>
            <div className="amount-input">
              <input
                id="expense-amount"
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
            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              value={date}
              max={toInputDate(new Date())}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={Boolean(errors.date)}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </div>
        </div>

        <span className="field-label">Category</span>
        <div className="category-chip-grid">
          {CATEGORIES.map((item, index) => {
            const selected = category === item.value
            return (
              <motion.button
                type="button"
                key={item.value}
                className={`category-chip${selected ? ' selected' : ''}`}
                onClick={() => setCategory(item.value)}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.15 }}
                whileTap={{ scale: 0.94 }}
                aria-pressed={selected}
                style={selected ? { background: item.color, borderColor: item.color, color: '#fff' } : undefined}
              >
                <item.icon />
                {item.label}
              </motion.button>
            )
          })}
        </div>

        <div className="form-group">
          <label htmlFor="expense-note">Note</label>
          <input
            id="expense-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional — anything you want to remember"
          />
        </div>

        <button type="submit" className="btn-primary auth-submit-btn" disabled={saving}>
          {saving ? <span className="spinner" /> : <><HiOutlineCheck /> {isEdit ? 'Save changes' : 'Add expense'}</>}
        </button>
      </form>
    </Modal>
  )
}