import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HiPlus } from 'react-icons/hi'
import toast from 'react-hot-toast'
import AIInsights from '../components/AIInsights'
import { CategoryPieChart, DailySpendChart } from '../components/Charts'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import IncomeForm from '../components/IncomeForm'
import { ListSkeleton, SummarySkeleton } from '../components/Skeleton'
import SummaryCards from '../components/SummaryCards'
import { useAuth } from '../context/AuthContext'
import {
  deleteExpense,
  getCategoryBreakdown,
  getDailyTrend,
  getExpenses,
  getSummary,
} from '../services/expenseService'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [expenseForm, setExpenseForm] = useState(null) // null | { existing }
  const [incomeForm, setIncomeForm] = useState(null)
  const [insightsKey, setInsightsKey] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [summaryData, expenseData, breakdownData, dailyData] = await Promise.all([
        getSummary(),
        getExpenses({ limit: 6 }),
        getCategoryBreakdown(),
        getDailyTrend(30),
      ])
      setSummary(summaryData)
      setRecent(expenseData.slice(0, 6))
      setBreakdown(breakdownData)
      setDaily(dailyData)
      setInsightsKey((key) => key + 1)
    } catch (error) {
      toast.error(error.friendlyMessage || 'Could not load your dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async (id) => {
    const snapshot = recent
    setRecent((items) => items.filter((item) => item.id !== id)) // optimistic
    try {
      await deleteExpense(id)
      toast.success('Expense deleted')
      loadData()
    } catch (error) {
      setRecent(snapshot)
      toast.error(error.friendlyMessage || 'Could not delete that.')
    }
  }

  const firstName = user?.name?.trim()?.split(' ')[0] || 'there'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            {greeting()}, {firstName}
          </h1>
          <p className="page-subtitle">Here is where your money stands today.</p>
        </div>

        <div className="page-actions">
          <button className="btn-secondary" onClick={() => setIncomeForm({})}>
            Add income
          </button>
          <motion.button
            className="btn-primary"
            onClick={() => setExpenseForm({})}
            whileTap={{ scale: 0.97 }}
          >
            <HiPlus /> Add expense
          </motion.button>
        </div>
      </div>

      {loading ? <SummarySkeleton /> : <SummaryCards summary={summary} />}

      <div className="content-grid">
        <motion.div
          className="panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
        >
          <div className="panel-header">
            <h3>Recent expenses</h3>
            <Link to="/transactions" className="panel-link">
              See all
            </Link>
          </div>

          {loading ? (
            <ListSkeleton rows={5} />
          ) : (
            <ExpenseList
              items={recent}
              type="expense"
              onEdit={(item) => setExpenseForm({ existing: item })}
              onDelete={handleDelete}
              emptyTitle="No expenses logged"
              emptyText="Add the first one and this list starts filling in."
              emptyAction={
                <button className="btn-primary" onClick={() => setExpenseForm({})}>
                  <HiPlus /> Add expense
                </button>
              }
            />
          )}
        </motion.div>

        <motion.div
          className="panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
        >
          <div className="panel-header">
            <h3>Where it goes</h3>
          </div>
          <CategoryPieChart data={breakdown} />
        </motion.div>
      </div>

      <motion.div
        className="panel"
        style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.4 }}
      >
        <div className="panel-header">
          <h3>Last 30 days</h3>
        </div>
        <DailySpendChart data={daily} />
      </motion.div>

      <motion.div
        style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <AIInsights key={insightsKey} compact limit={3} />
        <Link to="/insights" className="see-more-link">
          Open full insights
        </Link>
      </motion.div>

      <motion.button
        className="fab"
        onClick={() => setExpenseForm({})}
        aria-label="Add expense"
        whileHover={{ scale: 1.06, rotate: 90 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <HiPlus />
      </motion.button>

      <AnimatePresence>
        {expenseForm && (
          <ExpenseForm
            key="expense-form"
            existing={expenseForm.existing}
            onClose={() => setExpenseForm(null)}
            onSaved={loadData}
          />
        )}
        {incomeForm && (
          <IncomeForm
            key="income-form"
            onClose={() => setIncomeForm(null)}
            onSaved={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}