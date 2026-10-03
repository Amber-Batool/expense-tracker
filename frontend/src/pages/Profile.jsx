import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineCheck, HiOutlineGlobeAlt, HiOutlineLockClosed } from 'react-icons/hi'
import toast from 'react-hot-toast'
import CurrencySelect from '../components/CurrencySelect'
import Modal from '../components/Modal'
import { TileSkeleton } from '../components/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { changePassword, updateProfile } from '../services/authService'
import { getSummary } from '../services/expenseService'

function PasswordModal({ onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (next.length < 6) {
      setError('New password needs at least 6 characters.')
      return
    }
    if (next !== confirm) {
      setError('The two new passwords do not match.')
      return
    }

    setSaving(true)
    try {
      await changePassword(current, next)
      toast.success('Password changed')
      onClose()
    } catch (err) {
      setError(err.friendlyMessage || 'Could not change the password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Change password" onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Repeat new password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-primary auth-submit-btn" disabled={saving}>
          {saving ? <span className="spinner" /> : 'Change password'}
        </button>
      </form>
    </Modal>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { format, code, meta } = useCurrency()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(user?.name || '')
  const [currency, setCurrency] = useState(user?.currency || code)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setName(user?.name || '')
    setCurrency(user?.currency || code)
  }, [user?.name, user?.currency, code])

  const loadSummary = () =>
    getSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => {
    loadSummary()
  }, [])

  const dirty = name.trim() !== (user?.name || '') || currency !== (user?.currency || code)

  const handleSave = async (event) => {
    event.preventDefault()
    if (!dirty || savingProfile) return

    if (name.trim().length < 2) {
      toast.error('Name needs at least 2 characters.')
      return
    }

    setSavingProfile(true)
    try {
      const payload = {}
      if (name.trim() !== user?.name) payload.name = name.trim()
      if (currency !== user?.currency) payload.currency = currency

      const result = await updateProfile(payload)
      updateUser(result.user)

      if (result.rebased) {
        toast.success(
          `Now showing everything in ${result.rebased.base_currency}. ` +
            `${result.rebased.records_updated} records reconverted.`
        )
        // Totals changed under us — pull them again.
        setLoading(true)
        loadSummary()
      } else {
        toast.success('Profile saved')
      }
    } catch (error) {
      toast.error(error.friendlyMessage || 'Could not save your profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="page-subtitle">Your account and how money is displayed.</p>
        </div>
      </div>

      <motion.div
        className="card profile-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="profile-avatar-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
        >
          {initials}
        </motion.div>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <span className="profile-currency-tag">
            {meta?.flag} {code} · {meta?.name}
          </span>
        </div>
      </motion.div>

      {loading ? (
        <TileSkeleton count={3} />
      ) : (
        <div className="stat-tile-grid">
          {[
            ['Balance', summary?.balance || 0],
            ['Income', summary?.total_income || 0],
            ['Expenses', summary?.total_expense || 0],
          ].map(([label, value], index) => (
            <motion.div
              className="card stat-tile"
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.32 }}
            >
              <div className="stat-tile-label">{label}</div>
              <div className="stat-tile-value">{format(value)}</div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.form
        className="panel settings-panel"
        onSubmit={handleSave}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <div className="panel-header">
          <h3>Account settings</h3>
        </div>

        <div className="form-group">
          <label htmlFor="profile-name">Display name</label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="profile-currency">
            <HiOutlineGlobeAlt style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Base currency
          </label>
          <CurrencySelect
            id="profile-currency"
            value={currency}
            onChange={setCurrency}
          />
          <span className="field-hint">
            Every total is shown in this currency. Switching it reconverts your
            existing records, so past months stay comparable. You can still log an
            individual transaction in any other currency.
          </span>
        </div>

        <div className="settings-actions">
          <AnimatePresence>
            {dirty && (
              <motion.button
                type="submit"
                className="btn-primary"
                disabled={savingProfile}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
              >
                {savingProfile ? <span className="spinner" /> : <><HiOutlineCheck /> Save changes</>}
              </motion.button>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPassword(true)}
          >
            <HiOutlineLockClosed /> Change password
          </button>
        </div>
      </motion.form>

      <AnimatePresence>
        {showPassword && (
          <PasswordModal key="password-modal" onClose={() => setShowPassword(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}