import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/api'
import { RotateCw, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const RETURN_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  requested: { label: 'Requested', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  pending_review: { label: 'Under Review', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
  scheduled: { label: 'Pickup Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  picked_up: { label: 'Picked Up', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Package },
  in_transit: { label: 'In Transit', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Package },
  received: { label: 'Received', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  quality_check: { label: 'Quality Check', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: XCircle },
}

export default function Returns() {
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => api.get('/returns'),
  })

  const returns = data?.data?.data || data?.data || []
  const total = data?.data?.total || 0

  const filteredReturns = activeFilter === 'all'
    ? returns
    : returns.filter((r: any) => r.status === activeFilter)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">My Returns</h1>
          <p className="text-sm text-gray-500 mt-1">{total} return(s)</p>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {['all', 'requested', 'pending_review', 'approved', 'scheduled', 'refunded', 'cancelled'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center py-12">
            <RotateCw className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No returns yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              You haven't initiated any returns. Returns can be requested for delivered orders within 7 days.
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Orders
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {filteredReturns.map((returnItem: any, index: number) => {
              const config = RETURN_STATUS_CONFIG[returnItem.status] || RETURN_STATUS_CONFIG.requested
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={returnItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    to={`/returns/${returnItem.id}`}
                    className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <StatusIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Return #{returnItem.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(returnItem.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {returnItem.reason?.replace('_', ' ')}
                        </p>
                        {returnItem.items?.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Items:</span> {returnItem.items.length}
                          </p>
                        )}
                      </div>

                      {returnItem.refundAmount && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-600">Refund Amount</span>
                          <span className="text-sm font-semibold text-green-600">
                            ₹{returnItem.refundAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}