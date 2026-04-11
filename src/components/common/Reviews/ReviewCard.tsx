import { Star, ThumbsUp, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { reviewsApi } from '@/api'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title?: string
    comment?: string
    images?: string[]
    isVerified: boolean
    helpfulCount: number
    createdAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  onEdit?: () => void
  onDelete?: () => void
}

export default function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount)
  const [markedHelpful, setMarkedHelpful] = useState(false)

  const handleMarkHelpful = async () => {
    if (markedHelpful) return
    
    try {
      await reviewsApi.markHelpful(review.id)
      setHelpfulCount((prev) => prev + 1)
      setMarkedHelpful(true)
    } catch (error) {
      console.error('Error marking review as helpful:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-gray-100 py-6 last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={`${review.user.firstName} ${review.user.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-primary-700 font-medium">
                {getInitials(review.user.firstName, review.user.lastName)}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {review.user.firstName} {review.user.lastName}
              </span>
              {review.isVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Edit/Delete buttons for user's own review */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit review"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {review.title && (
        <h4 className="font-medium text-gray-900 mt-4 mb-2">
          {review.title}
        </h4>
      )}

      {review.comment && (
        <p className="text-gray-600 mt-2 leading-relaxed">
          {review.comment}
        </p>
      )}

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"
            >
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleMarkHelpful}
          disabled={markedHelpful}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
            markedHelpful
              ? 'bg-primary-50 text-primary-600 cursor-default'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Helpful</span>
          {helpfulCount > 0 && (
            <span className="text-xs">({helpfulCount})</span>
          )}
        </button>
      </div>
    </motion.div>
  )
}