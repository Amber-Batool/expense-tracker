import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { getCategoryMeta } from '../assets/categories'
import { useCurrency } from '../context/CurrencyContext'

function EmptyChart({ message }) {
  return (
    <div className="chart-empty">
      <p>{message}</p>
    </div>
  )
}

function useMoneyTooltip() {
  const { format } = useCurrency()

  return function MoneyTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null

    return (
      <div className="chart-tooltip">
        {label && <div className="chart-tooltip-label">{label}</div>}
        {payload.map((entry) => (
          <div className="chart-tooltip-row" key={entry.dataKey || entry.name}>
            <span className="chart-tooltip-dot" style={{ background: entry.color }} />
            <span className="chart-tooltip-name">{entry.name}</span>
            <span className="chart-tooltip-value">{format(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
}

const monthLabel = (month) => {
  const date = new Date(`${month}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) return month
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

// --------------------------------------------------------------------------

export function CategoryPieChart({ data }) {
  const { format, compact } = useCurrency()
  const [activeIndex, setActiveIndex] = useState(null)
  const MoneyTooltip = useMoneyTooltip()

  if (!data || data.length === 0) {
    return <EmptyChart message="Add a few expenses and the split will show up here." />
  }

  const total = data.reduce((sum, entry) => sum + entry.amount, 0)
  const focused = activeIndex === null ? null : data[activeIndex]

  return (
    <div className="pie-wrap">
      <div className="pie-canvas">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2.5}
              stroke="none"
              animationDuration={700}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={getCategoryMeta(entry.category).color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                  style={{ transition: 'opacity 0.2s ease' }}
                />
              ))}
            </Pie>
            <Tooltip content={<MoneyTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pie-center">
          <motion.div
            key={focused?.category || 'total'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pie-center-value">
              {compact(focused ? focused.amount : total)}
            </div>
            <div className="pie-center-label">
              {focused ? focused.category : 'Total spend'}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="pie-legend">
        {data.map((entry, index) => (
          <button
            type="button"
            key={entry.category}
            className={`legend-row${activeIndex === index ? ' active' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          >
            <span
              className="legend-dot"
              style={{ background: getCategoryMeta(entry.category).color }}
            />
            <span className="legend-name">{entry.category}</span>
            <span className="legend-value">{format(entry.amount)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------

export function MonthlyTrendChart({ data }) {
  const { compact } = useCurrency()
  const MoneyTooltip = useMoneyTooltip()

  if (!data || data.length < 2) {
    return <EmptyChart message="Two months of history and the trend line appears." />
  }

  const formatted = data.map((row) => ({ ...row, label: monthLabel(row.month) }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={compact}
          width={62}
        />
        <Tooltip content={<MoneyTooltip />} cursor={{ stroke: 'var(--border)' }} />
        <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: 8 }} iconType="circle" />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="var(--mint)"
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 0, fill: 'var(--mint)' }}
          activeDot={{ r: 6 }}
          animationDuration={900}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Expenses"
          stroke="var(--coral)"
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 0, fill: 'var(--coral)' }}
          activeDot={{ r: 6 }}
          animationDuration={900}
          animationBegin={150}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// --------------------------------------------------------------------------

export function SavingsAreaChart({ data }) {
  const { compact } = useCurrency()
  const MoneyTooltip = useMoneyTooltip()

  if (!data || data.length < 2) {
    return <EmptyChart message="Once you have two months logged, your savings curve shows here." />
  }

  const formatted = data.map((row) => ({ ...row, label: monthLabel(row.month) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={compact}
          width={62}
        />
        <Tooltip content={<MoneyTooltip />} />
        <Area
          type="monotone"
          dataKey="savings"
          name="Kept"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#savingsFill)"
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// --------------------------------------------------------------------------

export function DailySpendChart({ data }) {
  const { compact } = useCurrency()
  const MoneyTooltip = useMoneyTooltip()

  if (!data || data.length === 0) {
    return <EmptyChart message="Daily spending shows up as soon as you log something." />
  }

  const formatted = data.map((row) => ({
    ...row,
    label: new Date(`${row.date}T00:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
  }))

  const peak = Math.max(...formatted.map((row) => row.amount))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={compact}
          width={58}
        />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'var(--primary-light)' }} />
        <Bar dataKey="amount" name="Spent" radius={[4, 4, 0, 0]} animationDuration={800}>
          {formatted.map((row) => (
            <Cell
              key={row.date}
              fill={row.amount === peak && peak > 0 ? 'var(--coral)' : 'var(--primary)'}
              opacity={row.amount === 0 ? 0.15 : 0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}