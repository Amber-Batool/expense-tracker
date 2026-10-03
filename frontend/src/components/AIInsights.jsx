import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  HiOutlineExclamationCircle,
  HiOutlineLightBulb,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
} from 'react-icons/hi'
import { HiSparkles } from 'react-icons/hi'
import { useCurrency } from '../context/CurrencyContext'
import { getInsights } from '../services/aiService'
import { Skeleton } from './Skeleton'

const SEVERITY = {
  alert: { icon: HiOutlineExclamationCircle, label: 'Act on this' },
  watch: { icon: HiOutlineTrendingUp, label: 'Keep an eye on it' },
  good: { icon: HiOutlineShieldCheck, label: 'Going well' },
  info: { icon: HiOutlineLightBulb, label: 'Good to know' },
}

/** Animated ring that fills to the score. */
function HealthRing({ score = 0, grade, label }) {
  const reduceMotion = useReducedMotion()
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference

  const colour =
    score >= 80 ? 'var(--mint)' : score >= 65 ? 'var(--primary)' : score >= 50 ? 'var(--gold)' : 'var(--coral)'

  return (
    <div className="health-ring">
      <svg viewBox="0 0 130 130" width="130" height="130" role="img" aria-label={`Score ${score} out of 100`}>
        <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border)" strokeWidth="11" />
        <motion.circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduceMotion ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          transform="rotate(-90 65 65)"
        />
      </svg>

      <div className="health-ring-center">
        <motion.div
          className="health-score"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
          style={{ color: colour }}
        >
          {score}
        </motion.div>
        <div className="health-grade">
          {grade} · {label}
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight, index }) {
  const config = SEVERITY[insight.severity] || SEVERITY.info
  const Icon = config.icon

  return (
    <motion.article
      className={`insight-card severity-${insight.severity}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.06, 0.4), ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <span className="insight-icon">
        <Icon />
      </span>
      <div>
        <h4>{insight.title}</h4>
        <p>{insight.body}</p>
      </div>
    </motion.article>
  )
}

export default function AIInsights({ compact = false, limit }) {
  const { format } = useCurrency()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      setData(await getInsights())
    } catch (err) {
      setError(err.friendlyMessage || 'Could not load insights right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="panel insights-panel">
        <div className="panel-header">
          <h3>Insights</h3>
        </div>
        <Skeleton height={130} radius={16} />
        <Skeleton height={72} radius={12} style={{ marginTop: 14 }} />
        <Skeleton height={72} radius={12} style={{ marginTop: 10 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel insights-panel">
        <div className="panel-header">
          <h3>Insights</h3>
        </div>
        <div className="inline-error">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => load()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const insights = limit ? data.insights.slice(0, limit) : data.insights

  return (
    <div className="panel insights-panel">
      <div className="panel-header">
        <h3 className="insights-title">
          <motion.span
            className="insights-spark"
            animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <HiSparkles />
          </motion.span>
          Insights
        </h3>
        <button
          className={`icon-btn${refreshing ? ' spinning' : ''}`}
          onClick={() => load({ silent: true })}
          aria-label="Refresh insights"
          title="Refresh"
        >
          <HiOutlineRefresh />
        </button>
      </div>

      {!data.has_data ? (
        <div className="empty-state">
          <h4>Nothing to analyse yet</h4>
          <p>{data.insights[0]?.body}</p>
        </div>
      ) : (
        <>
          {!compact && data.health && (
            <div className="health-block">
              <HealthRing
                score={data.health.score}
                grade={data.health.grade}
                label={data.health.label}
              />

              <div className="health-bars">
                {[
                  ['Savings rate', data.health.breakdown.savings],
                  ['Spend vs income', data.health.breakdown.spend_ratio],
                  ['Category balance', data.health.breakdown.balance],
                  ['Tracking habit', data.health.breakdown.consistency],
                ].map(([label, points], index) => (
                  <div className="health-bar-row" key={label}>
                    <span className="health-bar-label">{label}</span>
                    <div className="health-bar-track">
                      <motion.span
                        className="health-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${(points / 25) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="health-bar-points">{Math.round(points)}/25</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="insight-list">
            <AnimatePresence mode="popLayout">
              {insights.map((insight, index) => (
                <InsightCard
                  key={`${insight.kind}-${insight.title}`}
                  insight={insight}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>

          {!compact && data.forecast && (
            <div className="forecast-strip">
              <div>
                <div className="forecast-label">Projected next month</div>
                <div className="forecast-value">{format(data.forecast.next_month)}</div>
              </div>
              <div className="forecast-range">
                likely between {format(data.forecast.low)} and {format(data.forecast.high)}
              </div>
            </div>
          )}

          {!compact && data.budget_suggestions?.length > 0 && (
            <div className="budget-block">
              <h4 className="block-title">Suggested monthly ceilings</h4>
              {data.budget_suggestions.map((row, index) => (
                <motion.div
                  className="budget-row"
                  key={row.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <span className="budget-category">{row.category}</span>
                  <div className="budget-track">
                    <motion.span
                      className="budget-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(row.share, 100)}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + index * 0.05 }}
                    />
                  </div>
                  <span className="budget-amounts">
                    <strong>{format(row.suggested_monthly)}</strong>
                    {row.suggested_monthly < row.current_monthly && (
                      <em>from {format(row.current_monthly)}</em>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {!compact && data.recurring?.length > 0 && (
            <div className="recurring-block">
              <h4 className="block-title">Repeats every month</h4>
              <div className="recurring-list">
                {data.recurring.map((item) => (
                  <div className="recurring-item" key={item.title}>
                    <div>
                      <div className="recurring-title">{item.title}</div>
                      <div className="recurring-meta">
                        {item.category} · seen in {item.months_seen} months
                      </div>
                    </div>
                    <div className="recurring-amount">
                      {format(item.average_amount)}
                      <span>{format(item.yearly_cost)}/yr</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}