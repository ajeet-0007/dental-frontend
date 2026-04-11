import { Star } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (interactive && onChange) {
      if (e.key === 'Enter' || e.key === ' ') {
        onChange(value)
      }
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= rating
        const isHalf = !isFilled && starValue - 0.5 <= rating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            className={clsx(
              'relative transition-transform',
              interactive && 'cursor-pointer hover:scale-110 focus:outline-none',
              !interactive && 'cursor-default'
            )}
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
          >
            <motion.div
              whileTap={interactive ? { scale: 0.9 } : {}}
            >
              <Star
                className={clsx(
                  sizeClasses[size],
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalf
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                )}
              />
            </motion.div>
          </button>
        )
      })}
    </div>
  )
}

interface RatingDisplayProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

export function RatingDisplay({ rating, count, size = 'md', showCount = true }: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div className="flex items-center gap-1">
      <StarRating rating={rating} size={size} />
      <span className={clsx(sizeClasses[size], 'font-medium text-gray-900')}>
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className={clsx(sizeClasses[size], 'text-gray-500')}>
          ({count})
        </span>
      )}
    </div>
  )
}