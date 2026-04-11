import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { cartApi } from '@/api'
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ChevronRight, ShoppingBag, RotateCcw, FileText, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function Orders() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled: isAuthenticated,
  })

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

  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const reorderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      setReorderingId(orderId)
      const response = await cartApi.reorder(orderId)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      if (data.success) {
        const addedCount = data.addedItems.length
        const failedCount = data.failedItems.length
        
        if (failedCount > 0) {
          toast.error(`${addedCount} item(s) added. ${failedCount} item(s) could not be added.`, {
            duration: 5000,
          })
        } else {
          toast.success(data.message)
        }
      } else {
        toast.error(data.message)
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add items to cart')
    },
    onSettled: () => {
      setReorderingId(null)
    },
  })

  const orders = data?.data?.orders || []

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { 
          bg: 'bg-gradient-to-r from-emerald-500 to-green-500', 
          text: 'text-white', 
          icon: CheckCircle, 
          label: 'Delivered',
          dot: 'bg-emerald-400'
        }
      case 'cancelled':
        return { 
          bg: 'bg-gradient-to-r from-red-500 to-rose-500', 
          text: 'text-white', 
          icon: XCircle, 
          label: 'Cancelled',
          dot: 'bg-red-400'
        }
      case 'shipped':
        return { 
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
          text: 'text-white', 
          icon: Truck, 
          label: 'Shipped',
          dot: 'bg-blue-400'
        }
      case 'confirmed':
        return { 
          bg: 'bg-gradient-to-r from-purple-500 to-violet-500', 
          text: 'text-white', 
          icon: Clock, 
          label: 'Confirmed',
          dot: 'bg-purple-400'
        }
      case 'processing':
        return { 
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500', 
          text: 'text-white', 
          icon: Clock, 
          label: 'Processing',
          dot: 'bg-amber-400'
        }
      case 'pending_payment':
        return { 
          bg: 'bg-gradient-to-r from-orange-500 to-amber-500', 
          text: 'text-white', 
          icon: AlertCircle, 
          label: 'Payment Pending',
          dot: 'bg-orange-400'
        }
      case 'payment_failed':
        return { 
          bg: 'bg-gradient-to-r from-red-500 to-pink-500', 
          text: 'text-white', 
          icon: XCircle, 
          label: 'Payment Failed',
          dot: 'bg-red-400'
        }
      default:
        return { 
          bg: 'bg-gradient-to-r from-gray-500 to-slate-500', 
          text: 'text-white', 
          icon: Clock, 
          label: status.charAt(0).toUpperCase() + status.slice(1),
          dot: 'bg-gray-400'
        }
    }
  }

  const getOrderTimeline = (status: string) => {
    const steps = [
      { key: 'placed', label: 'Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'processing', label: 'Processing', icon: Clock },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle },
    ]
    
    const statusOrder = ['pending', 'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    const currentIndex = statusOrder.indexOf(status)
    
    return steps.map((step, index) => ({
      ...step,
      completed: currentIndex >= index,
      active: currentIndex === index,
      cancelled: status === 'cancelled'
    }))
  }

  const filteredOrders = orders.filter((order: any) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'active') return ['pending', 'pending_payment', 'confirmed', 'processing', 'shipped'].includes(order.status)
    if (activeFilter === 'completed') return order.status === 'delivered'
    if (activeFilter === 'cancelled') return order.status === 'cancelled' || order.status === 'payment_failed'
    return true
  })

  const filterCounts = {
    all: orders.length,
    active: orders.filter((o: any) => ['pending', 'pending_payment', 'confirmed', 'processing', 'shipped'].includes(o.status)).length,
    completed: orders.filter((o: any) => o.status === 'delivered').length,
    cancelled: orders.filter((o: any) => ['cancelled', 'payment_failed'].includes(o.status)).length,
  }

  const canCancel = (status: string) => {
    return ['pending', 'pending_payment', 'confirmed', 'processing'].includes(status)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4 max-w-sm mx-auto"
        >
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-500/30"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShoppingBag className="h-12 w-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back!</h2>
          <p className="text-gray-500 mb-8 text-lg">Sign in to track your orders, manage returns, and more.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl shadow-primary-600/30 hover:shadow-primary-700/40 hover:scale-105"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8">
          <div className="h-10 w-40 bg-gray-200 rounded-2xl animate-pulse mb-8"></div>
          <div className="flex gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-6 animate-pulse"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-gray-100 rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
                  </div>
                  <div className="h-8 w-24 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="flex gap-4 mb-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-20 h-20 bg-gray-100 rounded-2xl"></div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
                  <div className="h-12 w-32 bg-gray-100 rounded-xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">My Orders</h1>
            {orders.length > 0 && (
              <p className="text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
            )}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide"
          >
            {[
              { key: 'all', label: 'All Orders', count: filterCounts.all },
              { key: 'active', label: 'Active', count: filterCounts.active },
              { key: 'completed', label: 'Completed', count: filterCounts.completed },
              { key: 'cancelled', label: 'Cancelled', count: filterCounts.cancelled },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'
                }`}
              >
                {filter.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeFilter === filter.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 && orders.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeFilter !== 'all' ? activeFilter : ''} orders</h3>
            <p className="text-gray-500 mb-6">
              {activeFilter === 'active' && "You don't have any active orders right now."}
              {activeFilter === 'completed' && "You haven't completed any orders yet."}
              {activeFilter === 'cancelled' && "No cancelled orders."}
              {activeFilter === 'all' && "When you place an order, it will appear here."}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30"
            >
              Start Shopping
            </button>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-12 text-center"
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Package className="h-12 w-12 text-primary-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">Your order history is empty. Start shopping to see your orders here.</p>
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl shadow-primary-600/30 hover:shadow-primary-700/40 hover:scale-105"
            >
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order: any, index: number) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon
              const timeline = getOrderTimeline(order.status)
              
              return (
                <motion.div 
                  key={order.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden hover:shadow-xl hover:shadow-gray-300/30 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Order Header */}
                  <div className="p-5 md:p-6 border-b border-gray-100">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-gray-900 tracking-wide">Order #{order.orderNumber}</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text} shadow-sm`}>
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
                          <span className="font-semibold text-gray-700">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Timeline (for non-cancelled orders) */}
                  {order.status !== 'cancelled' && order.status !== 'payment_failed' && (
                    <div className="px-5 md:px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        {timeline.map((step, idx) => (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                step.cancelled 
                                  ? 'bg-red-100 text-red-500' 
                                  : step.completed 
                                    ? `${statusConfig.bg} ${statusConfig.text} shadow-sm`
                                    : 'bg-gray-200 text-gray-400'
                              }`}>
                                {step.cancelled ? (
                                  <XCircle className="w-5 h-5" />
                                ) : (
                                  <step.icon className="w-5 h-5" />
                                )}
                              </div>
                              <span className={`text-xs mt-1.5 font-medium hidden sm:block ${
                                step.cancelled || step.active ? 'text-gray-700' : 'text-gray-400'
                              }`}>{step.label}</span>
                            </div>
                            {idx < timeline.length - 1 && (
                              <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                                step.cancelled 
                                  ? 'bg-red-200' 
                                  : timeline[idx + 1].completed || timeline[idx + 1].active
                                    ? `${statusConfig.dot}`
                                    : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Preview */}
                  <div className="p-5 md:p-6">
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                      {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
                        <Link 
                          key={idx} 
                          to={(item.productSlug && item.productSlug.trim()) ? `/products/${item.productSlug}` : `/products/${item.productId}`}
                          className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-primary-300 hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                        >
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <span className="text-white text-xs font-medium">View</span>
                          </div>
                        </Link>
                      ))}
                      {(order.items?.length || 0) > 4 && (
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 font-bold">+{(order.items?.length || 0) - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="px-5 md:px-6 pb-5 md:pb-6 pt-2 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'shipped' && (
                          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">
                            <Truck className="w-4 h-4" />
                            Track Order
                          </button>
                        )}
                        <button 
                          onClick={() => reorderMutation.mutate(order.id)}
                          disabled={reorderingId !== null}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all disabled:opacity-50"
                        >
                          {reorderingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          {reorderingId === order.id ? 'Adding...' : 'Reorder'}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all">
                          <FileText className="w-4 h-4" />
                          Invoice
                        </button>
                        {canCancel(order.status) && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={cancellingId !== null}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-700/40"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {confirmCancelId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-6 border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Your refund will be processed within 5-7 business days to your original payment method.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmCancelId(null)}
                    className="flex-1 px-5 py-3.5 text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={() => {
                      cancelMutation.mutate(confirmCancelId)
                      setConfirmCancelId(null)
                    }}
                    className="flex-1 px-5 py-3.5 text-white font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all shadow-lg shadow-red-500/30"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}