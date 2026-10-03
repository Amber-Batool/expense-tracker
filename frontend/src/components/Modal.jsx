import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { HiX } from 'react-icons/hi'


export default function Modal({ title, subtitle, onClose, children, maxWidth = 460 }) {
  const boxRef = useRef(null)

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    // Put the caret in the first field so the keyboard opens straight away.
    const firstField = boxRef.current?.querySelector('input, select, textarea')
    firstField?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <motion.div
        ref={boxRef}
        className="modal-box"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <HiX />
          </button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  )
}