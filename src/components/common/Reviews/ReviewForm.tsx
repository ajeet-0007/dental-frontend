import { useState, useRef, useEffect } from 'react'
import { Star, X, Upload, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { reviewsApi } from '@/api'
import api from '@/api'

interface ReviewFormProps {
  productId: number
  editReview?: {
    id: string
    rating: number
    title?: string
    comment?: string
    images?: string[]
  } | null
  onSuccess?: () => void
  onClose?: () => void
}

export default function ReviewForm({ productId, editReview, onSuccess, onClose }: ReviewFormProps) {
  const { isAuthenticated } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!editReview

  useEffect(() => {
    if (editReview) {
      setRating(editReview.rating)
      setTitle(editReview.title || '')
      setComment(editReview.comment || '')
      setImages(editReview.images || [])
    } else {
      setRating(0)
      setTitle('')
      setComment('')
      setImages([])
    }
  }, [editReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!comment.trim()) {
      toast.error('Please write a review')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && editReview) {
        await reviewsApi.update(editReview.id, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          images: images.length > 0 ? images : undefined,
        })
        toast.success('Review updated successfully!')
      } else {
        await reviewsApi.create({
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          images: images.length > 0 ? images : undefined,
        })
        toast.success('Review submitted successfully!')
      }
      setRating(0)
      setTitle('')
      setComment('')
      setImages([])
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length >= 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const remainingSlots = 5 - images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setIsUploading(true)

    try {
      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post('/imagekit/upload-review', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        if (response.data?.url) {
          setImages((prev) => [...prev, response.data.url])
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please login to write a review</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Rating Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-all ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400 scale-110'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Very Good!'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Summarize your review"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Share your experience with this product..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/1000
            </p>
          </div>

          {/* Images */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-lg overflow-hidden group"
                >
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="review-image-upload"
                  />
                  <label
                    htmlFor="review-image-upload"
                    className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors cursor-pointer ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span className="text-xs mt-1">Upload</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add up to 5 images (JPEG, PNG, WebP, GIF - max 5MB each)
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading || rating === 0 || !comment.trim()}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
          </button>
        </form>
      )}
    </motion.div>
  )
}