import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineChartPie,
  HiOutlineLogout,
  HiOutlineSwitchHorizontal,
  HiOutlineUser,
  HiOutlineViewGrid,
  HiSparkles,
  HiX,
} from 'react-icons/hi'
import { PiPlantFill } from 'react-icons/pi'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/transactions', label: 'Transactions', icon: HiOutlineSwitchHorizontal },
  { to: '/analytics', label: 'Analytics', icon: HiOutlineChartPie },
  { to: '/insights', label: 'Insights', icon: HiSparkles },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
]

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const { code, symbol } = useCurrency()
  const navigate = useNavigate()

  const handleLogout = () => {
    onNavigate?.()
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?'

  return (
    <>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <PiPlantFill />
        </span>
        Expensy
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }, index) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * index, duration: 0.28, ease: 'easeOut' }}
          >
            <NavLink
              to={to}
              onClick={onNavigate}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="sidebar-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-currency">
          <span className="sidebar-currency-symbol">{symbol}</span>
          <div>
            <div className="sidebar-currency-label">Showing totals in</div>
            <div className="sidebar-currency-code">{code}</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || ''}</div>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <HiOutlineLogout />
          Log out
        </button>
      </div>
    </>
  )
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation()

  // Close the drawer whenever the route changes or Escape is pressed.
  useEffect(() => {
    onClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    if (!open) return undefined

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      {/* Permanent rail on wide screens */}
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      {/* Drawer on narrow screens */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="drawer-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <motion.aside
              className="sidebar sidebar-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.4, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) onClose?.()
              }}
            >
              <button className="drawer-close" onClick={onClose} aria-label="Close menu">
                <HiX />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}