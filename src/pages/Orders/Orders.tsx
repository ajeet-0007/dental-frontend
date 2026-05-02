import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { cartApi } from '@/api'
import { Package, Clock, CheckCircle, AlertCircle, ShoppingBag, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { motion } from 'framer-motion'
import OrderCard from '@/components/common/OrderCard'

export default function Orders() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeFilter, setActiveFilter] = useState<string>(
    searchParams.get('filter') || 'all'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const statusFilterMap: Record<string, string | null> = {
    all: null,
    active: null, // handled client-side for multiple statuses
    completed: 'delivered',
    cancelled: 'cancelled',
    payment_pending: 'pending_payment',
    processing: 'processing',
    shipped: 'shipped',
    confirmed: 'confirmed',
    pending: 'pending',
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', currentPage, activeFilter],
    queryFn: () => {
      const params: any = { page: currentPage, limit: pageSize }
      const status = statusFilterMap[activeFilter]
      if (status) {
        params.status = status
      }
      return api.get('/orders', { params })
    },
    enabled: isAuthenticated,
  })

  // Sync filter to URL
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    setCurrentPage(1)
    setSearchParams(filter === 'all' ? {} : { filter })
  }

  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const reorderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      setReorderingId(orderId)
      const response = await cartApi.reorder(orderId)
      return response.data
    },
    onSuccess: async (data) => {
      try {
        const cartRes = await api.get('/cart')
        setCart(cartRes.data || [], Array.isArray(cartRes.data) ? cartRes.data.length : 0)
      } catch (error) {
        console.error('Failed to refresh cart:', error)
      }
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

  const ordersData = data?.data || { orders: [], total: 0, counts: { all: 0, active: 0, completed: 0, cancelled: 0 } }
  const orders = ordersData.orders || []
  const totalOrders = ordersData.total || 0
  const totalPages = Math.ceil(totalOrders / pageSize)
  const serverCounts = ordersData.counts || { all: 0, active: 0, completed: 0, cancelled: 0 }

  // Client-side filtering for 'all' and 'active' (multiple statuses)
  // For other filters, backend handles it
  const filteredOrders = useMemo(() => {
    let result = orders

    // Apply client-side filter for 'all' and 'active' filters
    if (activeFilter === 'all') {
      // Exclude payment_failed from all
      result = result.filter((o: any) => o.status !== 'payment_failed')
    } else if (activeFilter === 'active') {
      const activeStatuses = ['pending', 'pending_payment', 'confirmed', 'processing', 'shipped']
      result = result.filter((o: any) => activeStatuses.includes(o.status))
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter((o: any) =>
        o.orderNumber?.toLowerCase().includes(term) ||
        o.items?.some((item: any) =>
          item.productName?.toLowerCase().includes(term)
        )
      )
    }

    return result
  }, [orders, activeFilter, searchTerm])

  // Use server-side counts from API (accurate for all filters)
  const filterCounts = useMemo(() => {
    return {
      all: serverCounts.all || 0,
      active: serverCounts.active || 0,
      completed: serverCounts.completed || 0,
      cancelled: serverCounts.cancelled || 0,
    }
  }, [serverCounts])

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
          icon: AlertCircle, 
          label: 'Cancelled',
          dot: 'bg-red-400'
        }
      case 'shipped':
        return { 
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
          text: 'text-white', 
          icon: Clock, 
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
          icon: AlertCircle,
          label: 'Payment Failed',
          dot: 'bg-red-400'
        }
      case 'refunded':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          text: 'text-white',
          icon: CheckCircle,
          label: 'Refunded',
          dot: 'bg-green-400'
        }
      case 'rto':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
          text: 'text-white',
          icon: Package,
          label: 'Return to Origin',
          dot: 'bg-orange-400'
        }
      case 'delivery_failed':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          text: 'text-white',
          icon: AlertCircle,
          label: 'Delivery Failed',
          dot: 'bg-red-400'
        }
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          text: 'text-white',
          icon: Clock,
          label: 'Pending',
          dot: 'bg-gray-400'
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
      { key: 'shipped', label: 'Shipped', icon: Clock },
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
                className="bg-white rounded-xl border border-gray-200/80 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-28 bg-gray-100 rounded-md"></div>
                    <div className="h-3 w-36 bg-gray-100 rounded-md"></div>
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-md"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3 py-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-3.5 w-48 bg-gray-100 rounded-md"></div>
                        <div className="h-3 w-16 bg-gray-100 rounded-md"></div>
                      </div>
                      <div className="h-4 w-12 bg-gray-100 rounded-md"></div>
                    </div>
                  ))}
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
            {/* {orders.length > 0 && (
              <p className="text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
            )} */}
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        {orders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-8"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'all', label: 'All Orders', count: filterCounts.all },
                { key: 'active', label: 'Active', count: filterCounts.active },
                { key: 'completed', label: 'Completed', count: filterCounts.completed },
                { key: 'cancelled', label: 'Cancelled', count: filterCounts.cancelled },
                { key: 'payment_pending', label: 'Payment Pending', count: 0 },
                { key: 'processing', label: 'Processing', count: 0 },
                { key: 'shipped', label: 'Shipped', count: 0 },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterChange(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all duration-300 ${
                    activeFilter === filter.key
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
                      : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeFilter === filter.key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 && (searchTerm || activeFilter !== 'all') ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No orders found' : `No ${activeFilter} orders`}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? `No orders matching "${searchTerm}"` 
                : activeFilter === 'active' 
                  ? "You don't have any active orders right now."
                  : activeFilter === 'completed' 
                    ? "You haven't completed any orders yet."
                    : activeFilter === 'cancelled' 
                      ? "No cancelled orders."
                      : "When you place an order, it will appear here."
              }
            </p>
            {(searchTerm || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  handleFilterChange('all')
                }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30"
              >
                View All Orders
              </button>
            )}
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
          <>
            <div className="space-y-4">
              {filteredOrders.map((order: any, index: number) => {
                const statusConfig = getStatusConfig(order.status)
                const StatusIcon = statusConfig.icon
                const timeline = getOrderTimeline(order.status)
                
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    statusConfig={statusConfig}
                    timeline={timeline}
                    StatusIcon={StatusIcon}
                    index={index}
                    onReorder={(orderId) => reorderMutation.mutate(orderId)}
                    reorderingId={reorderingId}
                  />
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isFetching}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isFetching}
                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isFetching}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <span className="ml-4 text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}