import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { PiPlantFill } from 'react-icons/pi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../services/authService'
import '../styles/auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await loginApi(email.trim(), password)
      login(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.friendlyMessage || 'Could not log you in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <motion.span
          className="auth-orb orb-one"
          animate={{ x: [0, 28, 0], y: [0, -22, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="auth-orb orb-two"
          animate={{ x: [0, -24, 0], y: [0, 26, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
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
            Every rupee, lira and won
            <br />
            in one honest number.
          </h1>
          <p>
            Log what you spend, wherever you spend it. Expensy converts it all into
            your currency and tells you what the numbers actually mean.
          </p>

          <div className="auth-stat-row">
            {[
              ['24', 'Currencies'],
              ['0', 'Hidden charges'],
              ['100%', 'Your data'],
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
          Built for anyone who wants to know where their money goes.
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to pick up where you left off.</p>

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

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
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
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Log in'}
            </button>
          </form>

          <div className="auth-switch-line">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}