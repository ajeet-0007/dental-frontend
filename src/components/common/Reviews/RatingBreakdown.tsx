import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface RatingBreakdownProps {
  stats: {
    averageRating: number
    totalReviews: number
    ratingBreakdown: {
      5: number
      4: number
      3: number
      2: number
      1: number
    }
    verifiedCount: number
  }
}

export default function RatingBreakdown({ stats }: RatingBreakdownProps) {
  const { averageRating, totalReviews, ratingBreakdown } = stats

  const percentages = {
    5: totalReviews > 0 ? (ratingBreakdown[5] / totalReviews) * 100 : 0,
    4: totalReviews > 0 ? (ratingBreakdown[4] / totalReviews) * 100 : 0,
    3: totalReviews > 0 ? (ratingBreakdown[3] / totalReviews) * 100 : 0,
    2: totalReviews > 0 ? (ratingBreakdown[2] / totalReviews) * 100 : 0,
    1: totalReviews > 0 ? (ratingBreakdown[1] / totalReviews) * 100 : 0,
  }

  if (totalReviews === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center mt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">{totalReviews} reviews</div>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-3">{star}</span>
              <Star className="w-4 h-4 fill-gray-300 text-gray-300" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages[star as keyof typeof percentages]}%` }}
                  transition={{ duration: 0.5, delay: star * 0.1 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              <span className="text-xs text-gray-500 w-8">
                {ratingBreakdown[star as keyof typeof ratingBreakdown]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}