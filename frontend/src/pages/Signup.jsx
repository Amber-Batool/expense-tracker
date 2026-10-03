import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { PiPlantFill } from 'react-icons/pi'
import toast from 'react-hot-toast'
import CurrencySelect from '../components/CurrencySelect'
import { useAuth } from '../context/AuthContext'
import { signup as signupApi } from '../services/authService'
import '../styles/auth.css'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currency, setCurrency] = useState('PKR')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const strength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 10) score += 1
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    return score
  })()

  const strengthLabel = ['', 'Short', 'Fair', 'Good', 'Strong'][strength]

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Your name needs at least 2 characters.')
      return
    }
    if (password.length < 6) {
      setError('Passwords need at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const data = await signupApi(name.trim(), email.trim(), password, currency)
      login(data.access_token, data.user)
      toast.success('Account created')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.friendlyMessage || 'Could not create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <motion.span
          className="auth-orb orb-one"
          animate={{ x: [0, -26, 0], y: [0, 24, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="auth-orb orb-two"
          animate={{ x: [0, 22, 0], y: [0, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="auth-brand">
          <span className="auth-brand-mark">
            <PiPlantFill />
          </span>
          Expensy
        </div>

        <motion.div
          className="auth-visual-copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1>
            Start tracking today,
            <br />
            understand it by Friday.
          </h1>
          <p>
            Two minutes to set up. Pick the currency you think in, log a few days,
            and Expensy will tell you what your spending is really doing.
          </p>

          <div className="auth-stat-row">
            {[
              ['2 min', 'To set up'],
              ['24', 'Currencies'],
              ['Free', 'Always'],
            ].map(([number, label], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <div className="stat-num">{number}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="auth-footer-note">
          Your records stay in your own account.
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>Create your account</h2>
          <p className="auth-subtitle">No card, no trial, nothing to cancel.</p>

          <AnimatePresence>
            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 18 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <div className="password-field">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>

              {password && (
                <div className="strength-row">
                  <div className="strength-track">
                    <motion.span
                      className={`strength-fill level-${strength}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(strength / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="strength-label">{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="signup-currency">Currency you think in</label>
              <CurrencySelect
                id="signup-currency"
                value={currency}
                onChange={setCurrency}
              />
              <span className="field-hint">
                All your totals appear in this. You can change it later, and you can
                still log individual transactions in any other currency.
              </span>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>

          <div className="auth-switch-line">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}