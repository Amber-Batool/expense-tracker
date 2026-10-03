import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineSearch, HiOutlineX, HiPlus } from 'react-icons/hi'
import toast from 'react-hot-toast'
import CategoryFilter from '../components/CategoryFilter'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import IncomeForm from '../components/IncomeForm'
import { ListSkeleton } from '../components/Skeleton'
import { useCurrency } from '../context/CurrencyContext'
import {
  deleteExpense,
  deleteIncome,
  getExpenses,
  getIncome,
} from '../services/expenseService'

const TABS = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'income', label: 'Income' },
]

/** Waits for typing to settle before firing a request. */
function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Transactions() {
  const { format } = useCurrency()
  const [tab, setTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [expenseForm, setExpenseForm] = useState(null)
  const [incomeForm, setIncomeForm] = useState(null)

  const debouncedSearch = useDebounced(search)
  const firstLoad = useRef(true)

  const loadExpenses = useCallback(async () => {
    const data = await getExpenses({
      category,
      search: debouncedSearch || undefined,
    })
    setExpenses(data)
  }, [category, debouncedSearch])

  const loadIncome = useCallback(async () => {
    const data = await getIncome({ search: debouncedSearch || undefined })
    setIncome(data)
  }, [debouncedSearch])

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadExpenses(), loadIncome()])
    } catch (error) {
      toast.error(error.friendlyMessage || 'Could not load your transactions.')
    } finally {
      setLoading(false)
      firstLoad.current = false
    }
  }, [loadExpenses, loadIncome])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleDeleteExpense = async (id) => {
    const snapshot = expenses
    setExpenses((items) => items.filter((item) => item.id !== id))
    try {
      await deleteExpense(id)
      toast.success('Expense deleted')
    } catch (error) {
      setExpenses(snapshot)
      toast.error(error.friendlyMessage || 'Could not delete that.')
    }
  }

  const handleDeleteIncome = async (id) => {
    const snapshot = income
    setIncome((items) => items.filter((item) => item.id !== id))
    try {
      await deleteIncome(id)
      toast.success('Income deleted')
    } catch (error) {
      setIncome(snapshot)
      toast.error(error.friendlyMessage || 'Could not delete that.')
    }
  }

  const activeItems = tab === 'expenses' ? expenses : income

  const total = useMemo(
    () => activeItems.reduce((sum, item) => sum + (item.base_amount ?? item.amount ?? 0), 0),
    [activeItems]
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="page-subtitle">Everything you have logged, in one place.</p>
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

      <div className="tab-row">
        <div className="chart-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`chart-tab${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {tab === item.id && (
                <motion.span
                  layoutId="txn-tab-bg"
                  className="chart-tab-bg"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-total">
          <span>{activeItems.length} entries</span>
          <strong>{format(total)}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="search-box">
            <HiOutlineSearch />
            <input
              placeholder={tab === 'expenses' ? 'Search expenses' : 'Search income'}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search transactions"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <HiOutlineX />
              </button>
            )}
          </div>
        </div>

        {tab === 'expenses' && (
          <CategoryFilter value={category} onChange={setCategory} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {loading ? (
              <ListSkeleton rows={6} />
            ) : tab === 'expenses' ? (
              <ExpenseList
                items={expenses}
                type="expense"
                onEdit={(item) => setExpenseForm({ existing: item })}
                onDelete={handleDeleteExpense}
                emptyTitle={search || category !== 'all' ? 'No matches' : 'No expenses yet'}
                emptyText={
                  search || category !== 'all'
                    ? 'Try a different search or clear the category filter.'
                    : 'Log your first expense to get started.'
                }
              />
            ) : (
              <ExpenseList
                items={income}
                type="income"
                onEdit={(item) => setIncomeForm({ existing: item })}
                onDelete={handleDeleteIncome}
                emptyTitle={search ? 'No matches' : 'No income yet'}
                emptyText={
                  search
                    ? 'Try a different search.'
                    : 'Add what comes in so your balance means something.'
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {expenseForm && (
          <ExpenseForm
            key="expense-form"
            existing={expenseForm.existing}
            onClose={() => setExpenseForm(null)}
            onSaved={loadExpenses}
          />
        )}
        {incomeForm && (
          <IncomeForm
            key="income-form"
            existing={incomeForm.existing}
            onClose={() => setIncomeForm(null)}
            onSaved={loadIncome}
          />
        )}
      </AnimatePresence>
    </div>
  )
}