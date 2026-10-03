
import { motion } from 'framer-motion'
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import { HiOutlineBanknotes } from 'react-icons/hi2'
import { getCategoryMeta } from '../assets/categories'
import { formatMoney } from '../assets/currencies'
import { useCurrency } from '../context/CurrencyContext'

export default function ExpenseCard({ item, type = 'expense', onEdit, onDelete, index = 0 }) {
  const { code: baseCurrency, format } = useCurrency()
  const isExpense = type === 'expense'
  const meta = isExpense ? getCategoryMeta(item.category) : null
  const Icon = meta?.icon

  // Totals are always in the base currency, but the row shows what was
  // actually typed — logging ₺400 in Istanbul should still read as ₺400.
  const entryCurrency = item.currency || baseCurrency
  const displayAmount = formatMoney(item.amount, entryCurrency)
  const convertedNote =
    entryCurrency !== baseCurrency && item.base_amount != null
      ? format(item.base_amount)
      : null

  const label = isExpense ? item.title : item.source
  const categoryLabel = isExpense ? item.category : 'Income'
  const dateLabel = new Date(item.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <motion.div
      className="txn-row"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.2), ease: 'easeOut' }}
      whileHover={{ backgroundColor: 'var(--surface-raised)' }}
    >
      <div
        className="txn-icon"
        style={{
          background: isExpense ? meta.bg : 'var(--mint-light)',
          color: isExpense ? meta.color : 'var(--mint)',
        }}
      >
        {isExpense ? <Icon /> : <HiOutlineBanknotes />}
      </div>

      <div className="txn-body">
        <div className="txn-title" title={label}>
          {label}
        </div>
        <div className="txn-meta">
          <span className="txn-meta-item" title={categoryLabel}>
            {categoryLabel}
          </span>
          <span className="txn-meta-dot" />
          <span className="txn-meta-item" title={dateLabel}>
            {dateLabel}
          </span>
          {item.note && (
            <>
              <span className="txn-meta-dot" />
              <span className="txn-meta-item txn-note" title={item.note}>
                {item.note}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount and actions stack vertically so their widths don't add up
          side by side — that's what was starving the title of space. */}
      <div className="txn-side">
        <div className={`txn-amount ${isExpense ? 'negative' : 'positive'}`}>
          {isExpense ? '−' : '+'}
          {displayAmount}
        </div>
        {convertedNote && <div className="txn-converted">≈ {convertedNote}</div>}

        <div className="txn-actions">
          {onEdit && (
            <button
              className="icon-btn"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${label}`}
              title="Edit"
            >
              <HiOutlinePencil />
            </button>
          )}
          {onDelete && (
            <button
              className="icon-btn danger"
              onClick={() => onDelete(item.id)}
              aria-label={`Delete ${label}`}
              title="Delete"
            >
              <HiOutlineTrash />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}