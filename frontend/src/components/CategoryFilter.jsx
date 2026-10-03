import { motion } from 'framer-motion'
import { CATEGORIES } from '../assets/categories'


export default function CategoryFilter({ value, onChange }) {
  const options = [{ value: 'all', label: 'All', icon: null }, ...CATEGORIES]

  return (
    <div className="filter-rail" role="group" aria-label="Filter by category">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            type="button"
            key={option.value}
            className={`filter-chip${selected ? ' selected' : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
          >
            {selected && (
              <motion.span
                layoutId="filter-chip-bg"
                className="filter-chip-bg"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            {option.icon && <option.icon />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}