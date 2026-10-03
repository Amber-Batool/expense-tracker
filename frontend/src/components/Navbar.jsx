import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiMenuAlt2 } from 'react-icons/hi'
import { PiPlantFill } from 'react-icons/pi'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS } from './Sidebar'

export default function Navbar({ onOpenMenu }) {
  const { user } = useAuth()
  const location = useLocation()
  const railRef = useRef(null)

  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?'

  // Keep the active chip in view when the route changes — otherwise the
  // current page can sit off-screen in the scroll rail.
  useEffect(() => {
    const rail = railRef.current
    const active = rail?.querySelector('.nav-chip.active')
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [location.pathname])

  return (
    <header className="mobile-header">
      <div className="mobile-header-bar">
        <button className="menu-button" onClick={onOpenMenu} aria-label="Open menu">
          <HiMenuAlt2 />
        </button>

        <div className="mobile-header-brand">
          <PiPlantFill />
          Expensy
        </div>

        <NavLink to="/profile" className="mobile-header-avatar" aria-label="Profile">
          {initials}
        </NavLink>
      </div>

      {/* Horizontal scroll rail — the quick way to move between pages on a phone */}
      <div className="nav-rail" ref={railRef}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-chip${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-chip-active"
                    className="nav-chip-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </header>
  )
}