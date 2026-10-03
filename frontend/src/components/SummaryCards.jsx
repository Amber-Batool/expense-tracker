import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { HiOutlineArrowDown, HiOutlineArrowUp, HiTrendingDown, HiTrendingUp } from 'react-icons/hi'
import { PiPlantFill } from 'react-icons/pi'
import { useCurrency } from '../context/CurrencyContext'

/** Counts up to the value, then formats it in the active currency. */
function CountUp({ value = 0 }) {
  const { format } = useCurrency()
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(() => format(reduceMotion ? value : 0))

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(format(value))
      return undefined
    }

    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    })

    return () => controls.stop()
  }, [value, format, reduceMotion, motionValue])

  return <span>{display}</span>
}

function ChangeBadge({ change }) {
  if (change === null || change === undefined) return null

  const rising = change > 0
  const Icon = rising ? HiTrendingUp : HiTrendingDown

  return (
    <span className={`change-badge ${rising ? 'up' : 'down'}`}>
      <Icon />
      {Math.abs(change)}% vs last month
    </span>
  )
}

export default function SummaryCards({ summary }) {
  const {
    total_income: totalIncome = 0,
    total_expense: totalExpense = 0,
    balance = 0,
    this_month_expense: thisMonthExpense = 0,
    this_month_income: thisMonthIncome = 0,
    month_over_month_change: change = null,
    savings_rate: savingsRate = 0,
  } = summary || {}

  const { format } = useCurrency()
  const positive = balance >= 0

  return (
    <div className="summary-grid">
      <motion.div
        className="summary-card summary-card-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span
          className="hero-glow"
          animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.8, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div>
          <div className="summary-card-label">
            <PiPlantFill />
            Balance
          </div>
          <div className="summary-card-value">
            <CountUp value={balance} />
          </div>
        </div>

        <div className="summary-card-sub">
          {positive
            ? `You are keeping ${savingsRate}% of what you earn.`
            : 'Spending is running ahead of income right now.'}
        </div>
      </motion.div>

      <motion.div
        className="summary-card summary-card-plain"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
      >
        <div>
          <div className="summary-card-icon icon-mint">
            <HiOutlineArrowDown />
          </div>
          <div className="summary-card-label">Income</div>
          <div className="summary-card-value">
            <CountUp value={totalIncome} />
          </div>
        </div>
        <div className="summary-card-sub muted">
          {format(thisMonthIncome)} this month
        </div>
      </motion.div>

      <motion.div
        className="summary-card summary-card-plain"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
      >
        <div>
          <div className="summary-card-icon icon-coral">
            <HiOutlineArrowUp />
          </div>
          <div className="summary-card-label">Expenses</div>
          <div className="summary-card-value">
            <CountUp value={totalExpense} />
          </div>
        </div>
        <div className="summary-card-sub muted">
          {format(thisMonthExpense)} this month
          <ChangeBadge change={change} />
        </div>
      </motion.div>
    </div>
  )
}