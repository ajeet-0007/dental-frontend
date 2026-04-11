import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api'
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ChevronRight, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop'

export default function Orders() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled: isAuthenticated,
  })

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      setCancellingId(id)
      return api.post(`/orders/${id}/cancel`, {})
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      toast.error('Failed to cancel order')
    },
    onSettled: () => {
      setCancellingId(null)
    },
  })

  const orders = data?.data?.orders || []

  const canCancel = (status: string) => {
    return ['pending', 'pending_payment', 'confirmed', 'processing'].includes(status)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, label: 'Delivered' }
      case 'cancelled':
        return { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, label: 'Cancelled' }
      case 'shipped':
        return { bg: 'bg-blue-50', text: 'text-blue-600', icon: Truck, label: 'Shipped' }
      case 'confirmed':
        return { bg: 'bg-purple-50', text: 'text-purple-600', icon: Clock, label: 'Confirmed' }
      case 'processing':
        return { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, label: 'Processing' }
      case 'pending_payment':
        return { bg: 'bg-orange-50', text: 'text-orange-600', icon: AlertCircle, label: 'Payment Pending' }
      case 'payment_failed':
        return { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, label: 'Payment Failed' }
      default:
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock, label: status.charAt(0).toUpperCase() + status.slice(1) }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center px-4 max-w-sm mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please login to view orders</h2>
          <p className="text-gray-500 mb-6">Sign in to track your orders, manage returns, and more.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="h-8 w-32 md:h-10 md:w-48 bg-gray-200 rounded-xl animate-pulse mb-6 md:mb-8"></div>
          <div className="space-y-4 md:space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 md:p-6 animate-pulse">
                <div className="flex gap-3 md:gap-5">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-xl"></div>
                    ))}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-5 bg-gray-100 rounded w-24"></div>
                      <div className="h-10 w-28 bg-gray-100 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Orders</h1>
          {orders.length > 0 && (
            <span className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">When you place an order, it will appear here.</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {orders.map((order: any) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="p-4 md:p-5 border-b border-gray-100">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order #{order.orderNumber}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {' • '}
                          <span className="font-medium text-gray-700">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg md:text-xl font-bold text-gray-900">₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Products Preview */}
                  <div className="p-4 md:p-5">
                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
                      {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
                        <Link 
                          key={idx} 
                          to={(item.productSlug && item.productSlug.trim()) ? `/products/${item.productSlug}` : `/products/${item.productId}`}
                          className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
                        >
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={DEFAULT_IMAGE}
                              alt="Product"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </Link>
                      ))}
                      {(order.items?.length || 0) > 4 && (
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 font-semibold text-sm border border-gray-100 flex-shrink-0">
                          +{(order.items?.length || 0) - 4} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="px-4 md:px-5 pb-4 md:pb-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div className="flex gap-2 w-full sm:w-auto">
                      {canCancel(order.status) && (
                        <button
                          onClick={() => setConfirmCancelId(order.id)}
                          disabled={cancellingId !== null}
                          className="flex-1 sm:flex-none text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2.5 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this order? Your money will be refunded within 5-7 business days.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancelId(null)}
                  className="flex-1 px-4 py-3 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => {
                    cancelMutation.mutate(confirmCancelId)
                    setConfirmCancelId(null)
                  }}
                  className="flex-1 px-4 py-3 text-white font-semibold bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/30"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
