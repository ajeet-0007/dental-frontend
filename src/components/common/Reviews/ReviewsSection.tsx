import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Star, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { reviewsApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import RatingBreakdown from './RatingBreakdown'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal'

interface ReviewsSectionProps {
  productId: string | number
}

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
] as const

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { isAuthenticated, user } = useAuthStore()
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState<any>(null)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)

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

  const userReview = isAuthenticated && user
    ? reviews.find((r: any) => r.user?.id === user.id)
    : null

  const handleReviewSuccess = () => {
    setShowForm(false)
    setEditingReview(null)
    refetch()
  }

  const handleEditReview = (review: any) => {
    setEditingReview(review)
    setShowForm(true)
  }

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return

    try {
      await reviewsApi.delete(deleteReviewId)
      toast.success('Review deleted successfully')
      refetch()
      setDeleteReviewId(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete review')
      setDeleteReviewId(null)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingReview(null)
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

          {/* Write/Edit Review Button */}
          <div className="mt-6 space-y-3">
            {isAuthenticated && userReview ? (
              <button
                onClick={() => handleEditReview(userReview)}
                className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Edit Your Review
              </button>
            ) : isAuthenticated && canReviewData?.data?.canReview && !canReviewData?.data?.existingReview ? (
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Write a Review
              </button>
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
                  productId={Number(productId)}
                  editReview={editingReview}
                  onSuccess={handleReviewSuccess}
                  onClose={handleCloseForm}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          {/* Sort Options */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span>Sort by: <span className="font-medium">{sortOptions.find(o => o.value === sort)?.label}</span></span>
                <ChevronDown className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {sortDropdownOpen && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[150px]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSort(option.value)
                        setSortDropdownOpen(false)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg ${
                        sort === option.value 
                          ? 'bg-primary-50 text-primary-600 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
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
                <ReviewCard
                  key={review.id}
                  review={review}
                  onEdit={review.user?.id === user?.id ? () => handleEditReview(review) : undefined}
                  onDelete={review.user?.id === user?.id ? () => setDeleteReviewId(review.id) : undefined}
                />
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

      <DeleteConfirmModal
        isOpen={!!deleteReviewId}
        onClose={() => setDeleteReviewId(null)}
        onConfirm={handleDeleteReview}
        title="Delete Review?"
        message="Are you sure you want to delete this review? This action cannot be undone."
      />
    </div>
  )
}