import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CategoryPieChart,
  DailySpendChart,
  MonthlyTrendChart,
  SavingsAreaChart,
} from '../components/Charts'
import { ChartSkeleton, TileSkeleton } from '../components/Skeleton'
import { useCurrency } from '../context/CurrencyContext'
import {
  getCategoryBreakdown,
  getDailyTrend,
  getMonthlyTrend,
  getSummary,
} from '../services/expenseService'

export default function Analytics() {
  const { format } = useCurrency()
  const [breakdown, setBreakdown] = useState([])
  const [trend, setTrend] = useState([])
  const [daily, setDaily] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [breakdownData, trendData, summaryData, dailyData] = await Promise.all([
          getCategoryBreakdown(),
          getMonthlyTrend(12),
          getSummary(),
          getDailyTrend(30),
        ])
        if (cancelled) return
        setBreakdown(breakdownData)
        setTrend(trendData)
        setSummary(summaryData)
        setDaily(dailyData)
      } catch (error) {
        if (!cancelled) {
          toast.error(error.friendlyMessage || 'Could not load analytics.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const topCategory = breakdown[0] || null
  const averageMonthly =
    trend.length > 0
      ? trend.reduce((sum, row) => sum + row.expense, 0) / trend.length
      : 0

  const tiles = [
    { label: 'This month', value: format(summary?.this_month_expense || 0) },
    {
      label: 'Biggest category',
      value: topCategory ? `${topCategory.category} · ${topCategory.share}%` : '—',
    },
    { label: 'Monthly average', value: format(averageMonthly) },
    { label: 'Transactions', value: summary?.transaction_count ?? 0 },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="page-subtitle">
            Where the money went, month by month and category by category.
          </p>
        </div>
      </div>

      {loading ? (
        <TileSkeleton count={4} />
      ) : (
        <div className="stat-tile-grid four">
          {tiles.map((tile, index) => (
            <motion.div
              className="card stat-tile"
              key={tile.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              whileHover={{ y: -3 }}
            >
              <div className="stat-tile-label">{tile.label}</div>
              <div className="stat-tile-value">{tile.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        className="panel analytics-chart-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="panel-header">
          <h3>Income against expenses</h3>
        </div>
        {loading ? <ChartSkeleton height={280} /> : <MonthlyTrendChart data={trend} />}
      </motion.div>

      <div className="content-grid">
        <motion.div
          className="panel analytics-chart-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4 }}
        >
          <div className="panel-header">
            <h3>What you kept each month</h3>
          </div>
          {loading ? <ChartSkeleton height={220} /> : <SavingsAreaChart data={trend} />}
        </motion.div>

        <motion.div
          className="panel analytics-chart-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
        >
          <div className="panel-header">
            <h3>Spending by category</h3>
          </div>
          {loading ? <ChartSkeleton height={230} /> : <CategoryPieChart data={breakdown} />}
        </motion.div>
      </div>

      <motion.div
        className="panel analytics-chart-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
      >
        <div className="panel-header">
          <h3>Day by day, last 30 days</h3>
        </div>
        {loading ? <ChartSkeleton height={180} /> : <DailySpendChart data={daily} />}
      </motion.div>
    </div>
  )
}