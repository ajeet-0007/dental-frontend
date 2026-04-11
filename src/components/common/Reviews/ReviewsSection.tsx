import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Star, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { reviewsApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import RatingBreakdown from './RatingBreakdown'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'

interface ReviewsSectionProps {
  productId: string | number
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { isAuthenticated } = useAuthStore()
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['reviewStats', productId],
    queryFn: () => reviewsApi.getStats(String(productId)),
  })

  const { data: reviewsData, isLoading: reviewsLoading, refetch } = useQuery({
    queryKey: ['reviews', productId, sort, page],
    queryFn: () => reviewsApi.getByProduct(String(productId), {
      page,
      limit: 10,
      sort,
    }),
  })

  const { data: canReviewData } = useQuery({
    queryKey: ['canReview', productId],
    queryFn: () => reviewsApi.canReview(String(productId)),
    enabled: isAuthenticated,
  })

  const stats = statsData?.data
  const reviews = reviewsData?.data?.reviews || []
  const totalPages = reviewsData?.data?.totalPages || 1
  const total = reviewsData?.data?.total || 0

  const handleSortChange = (newSort: typeof sort) => {
    setSort(newSort)
    setPage(1)
  }

  const handleReviewSuccess = () => {
    setShowForm(false)
    refetch()
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Customer Reviews
        </h2>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">
            {total} {total === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          {statsLoading ? (
            <div className="animate-pulse bg-gray-100 h-48 rounded-lg" />
          ) : stats ? (
            <RatingBreakdown stats={stats} />
          ) : null}

          {/* Write Review Button */}
          <div className="mt-6">
            {isAuthenticated && canReviewData?.data?.canReview ? (
              canReviewData.data.existingReview ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-medium">
                    You have already reviewed this product
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Write a Review
                </button>
              )
            ) : !isAuthenticated ? (
              <a
                href="/login"
                className="block w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Login to Write a Review
              </a>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm">
                  You can only review products you have purchased
                </p>
              </div>
            )}
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <ReviewForm
                  productId={String(productId)}
                  onSuccess={handleReviewSuccess}
                  onClose={() => setShowForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          {/* Sort Options */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <div className="flex gap-1">
                {(['newest', 'oldest', 'highest', 'lowest'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      sort === option
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                Be the first to review this product
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}