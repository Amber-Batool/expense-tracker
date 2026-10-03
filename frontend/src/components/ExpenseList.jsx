import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineInboxIn } from 'react-icons/hi'
import ExpenseCard from './ExpenseCard'

export default function ExpenseList({
  items,
  type = 'expense',
  onEdit,
  onDelete,
  emptyTitle,
  emptyText,
  emptyAction,
}) {
  if (!items || items.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="empty-state-icon"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HiOutlineInboxIn />
        </motion.div>
        <h4>{emptyTitle || 'Nothing here yet'}</h4>
        <p>
          {emptyText ||
            'Add your first transaction and this list will fill up as you go.'}
        </p>
        {emptyAction}
      </motion.div>
    )
  }

  return (
    <div className="txn-list">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item, index) => (
          <ExpenseCard
            key={item.id}
            item={item}
            index={index}
            type={type}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}