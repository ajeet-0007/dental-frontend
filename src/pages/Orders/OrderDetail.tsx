import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, MapPin, CheckCircle, Loader2, RefreshCw, Clock, Truck, XCircle, AlertCircle, ShieldCheck, RotateCw, Tag, Undo2, Calendar, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop'

export default function OrderDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [tracking, setTracking] = useState<any>(null)
  const [_trackingLoading, setTrackingLoading] = useState(false)
  const verificationRef = useRef(false)

  const [trackingExpanded, setTrackingExpanded] = useState(false)

  const fetchOrder = useCallback(async () => {
    console.log('[OrderDetail] fetchOrder called with id:', id)
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      console.log('[OrderDetail] Response status:', res.status)
      
      if (!res.ok) {
        console.error('[OrderDetail] Error response:', res.status, res.statusText)
        const errorData = await res.json().catch(() => ({}))
        console.error('[OrderDetail] Error data:', errorData)
        toast.error(errorData.message || 'Failed to load order')
        setOrder(null)
        return
      }
      
      const data = await res.json()
      console.log('[OrderDetail] Full response:', JSON.stringify(data, null, 2))
      
      // Handle both wrapped and unwrapped responses
      // API might return { data: order } or just order directly
      let orderData = null
      
      if (data && typeof data === 'object') {
        // Check if it's wrapped in { data: {...} }
        if (data.data && typeof data.data === 'object' && data.data.id) {
          orderData = data.data
        }
        // Check if it's a direct order object with id
        else if (data.id) {
          orderData = data
        }
        // Check if it has orderNumber (another possible format)
        else if (data.orderNumber) {
          orderData = data
        }
      }
      
      console.log('[OrderDetail] Parsed orderData:', orderData)
      
      if (orderData) {
        setOrder(orderData)
      } else {
        console.error('[OrderDetail] No valid order data, response was:', data)
        toast.error('Order not found')
        setOrder(null)
      }
    } catch (error) {
      console.error('[OrderDetail] Error fetching order:', error)
      toast.error('Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const verifyPayment = useCallback(async (sid: string) => {
    if (verifying || verificationRef.current) {
      console.log('[OrderDetail] Already verifying, skipping')
      return
    }

    setVerifying(true)
    console.log('[OrderDetail] Starting verification with sessionId:', sid)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify-session`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId: sid })
      })
      const data = await res.json()
      console.log('[OrderDetail] Verification result:', data)

      if (data.success) {
        toast.success('Payment verified! Order confirmed.')
        await fetchOrder()
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        
        // Clear URL params after successful verification
        const url = new URL(window.location.href)
        if (url.searchParams.has('session_id') || url.searchParams.has('payment')) {
          url.searchParams.delete('session_id')
          url.searchParams.delete('payment')
          window.history.replaceState({}, '', url.toString())
          console.log('[OrderDetail] Cleared URL params')
        }
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Could not verify payment')
    } finally {
      setVerifying(false)
    }
  }, [verifying, fetchOrder, queryClient])

  const handleRescheduleDelivery = useCallback(async () => {
    if (!order?.shipmentId) {
      toast.error('Shipment not found')
      return
    }
    
    try {
      const token = localStorage.getItem('accessToken')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/shipping/shipments/${order.shipmentId}/reschedule`,
        {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ 
            newDeliveryDate: tomorrow.toISOString().split('T')[0]
          })
        }
      )
      const data = await res.json()
      
      if (data.success) {
        toast.success('Delivery rescheduled successfully')
        fetchOrder()
      } else {
        toast.error(data.message || 'Failed to reschedule delivery')
      }
    } catch (error) {
      console.error('Reschedule error:', error)
      toast.error('Could not reschedule delivery')
    }
  }, [order?.shipmentId, fetchOrder])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('session_id')
    const paymentStatus = params.get('payment')
    console.log('[OrderDetail] URL params - sessionId:', sid, 'payment:', paymentStatus)
    
    setSessionId(sid)
    fetchOrder()
    fetchTracking()
    
    if (sid) {
      verifyPayment(sid)
    }
    
    if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled.')
    }
  }, [id])

  const fetchTracking = useCallback(async () => {
    if (!id) return
    setTrackingLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/tracking`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await res.json()
      if (data.data) {
        setTracking(data.data)
      }
    } catch (error) {
      console.error('Error fetching tracking:', error)
    } finally {
      setTrackingLoading(false)
    }
  }, [id])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-4">Unable to load order details. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
          <Link to="/orders" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Delivered', dot: 'bg-emerald-400' }
      case 'cancelled':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: XCircle, label: 'Cancelled', dot: 'bg-red-400' }
      case 'shipped':
        return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Truck, label: 'Shipped', dot: 'bg-blue-400' }
      case 'confirmed':
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: Clock, label: 'Confirmed', dot: 'bg-purple-400' }
      case 'processing':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Clock, label: 'Processing', dot: 'bg-amber-400' }
      case 'pending_payment':
        return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: AlertCircle, label: 'Payment Pending', dot: 'bg-orange-400' }
      case 'payment_failed':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: XCircle, label: 'Payment Failed', dot: 'bg-red-400' }
      case 'rto':
        return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: RefreshCw, label: 'Return to Origin', dot: 'bg-orange-400' }
      case 'delivery_failed':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: AlertCircle, label: 'Delivery Failed', dot: 'bg-red-400' }
      case 'refunded':
        return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: CheckCircle, label: 'Refunded', dot: 'bg-green-400' }
      case 'pending':
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Clock, label: 'Pending', dot: 'bg-gray-400' }
      default:
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: status.charAt(0).toUpperCase() + status.slice(1), dot: 'bg-yellow-400' }
    }
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Link
            to="/orders"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-sm md:text-base font-medium">Back to Orders</span>
          </Link>
          <button
            onClick={fetchOrder}
            disabled={verifying}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${verifying ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Alerts */}
        {verifying && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 md:mb-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-amber-600 animate-spin flex-shrink-0" />
            <span className="text-amber-800 text-sm font-medium">Verifying payment with Stripe...</span>
          </div>
        )}

        {!verifying && sessionId && order.status !== 'pending_payment' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 md:mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800 text-sm font-medium">Payment successful! Your order has been confirmed.</span>
          </div>
        )}

        {order.status === 'pending_payment' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-4 md:mb-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-400 mb-3" />
            <h3 className="text-lg font-bold text-orange-800 mb-1">Payment Verification Needed</h3>
            <p className="text-orange-600 text-sm mb-4">
              Click below to verify your payment and confirm the order.
            </p>
            <button
              onClick={() => sessionId && verifyPayment(sessionId)}
              disabled={verifying}
              className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-lg shadow-orange-600/30"
            >
              {verifying ? 'Verifying...' : 'Verify Payment Now'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Order Header Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">#{order.orderNumber}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                      weekday: 'short',
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Order Progress Timeline */}
            {(() => {
              const timeline = getOrderTimeline(order.status)
              const completedSteps = timeline.filter(step => step.completed && !step.cancelled).length
              return (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Desktop - Horizontal Timeline */}
                  <div className="hidden sm:block px-5 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                      {timeline.map((step: any, idx: number) => (
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
                            <span className={`text-xs mt-1.5 font-medium ${
                              step.cancelled || step.active ? 'text-gray-700' : 'text-gray-400'
                            }`}>{step.label}</span>
                          </div>
                          {idx < timeline.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                              step.cancelled 
                                ? 'bg-red-200' 
                                : timeline[idx + 1].completed || timeline[idx + 1].active
                                  ? statusConfig.dot || 'bg-primary-500'
                                  : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile - Collapsible Tracking */}
                  <div className="sm:hidden">
                    <button
                      onClick={() => setTrackingExpanded(!trackingExpanded)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{statusConfig.label}</p>
                          <p className="text-xs text-gray-500">{completedSteps} of {timeline.length} steps completed</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-all duration-300 ${trackingExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {trackingExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-gray-50"
                        >
                          <div className="p-4 space-y-0">
                            {timeline.map((step: any) => (
                              <div key={step.key} className="flex items-center justify-between py-2.5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                    step.cancelled 
                                      ? 'bg-red-100 text-red-500' 
                                      : step.completed 
                                        ? `${statusConfig.bg} ${statusConfig.text}`
                                        : step.active
                                          ? `${statusConfig.bg} ${statusConfig.text} ring-2 ring-offset-2 ${statusConfig.text.replace('text-', 'ring-')}`
                                          : 'bg-gray-200 text-gray-400'
                                  }`}>
                                    {step.cancelled ? (
                                      <XCircle className="w-4 h-4" />
                                    ) : step.completed ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      <step.icon className="w-4 h-4" />
                                    )}
                                  </div>
                                  <span className={`text-sm font-medium ${
                                    step.cancelled || step.completed || step.active ? 'text-gray-900' : 'text-gray-400'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                                {step.active && (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                                    In Progress
                                  </span>
                                )}
                                {step.completed && !step.active && !step.cancelled && (
                                  <span className="text-xs text-emerald-600 font-medium">Done</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })()}

            {/* RTO Alert */}
            {order.isRTO && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-1">Return to Origin</h3>
                    <p className="text-sm text-orange-700">
                      Your package is being returned to the sender. If you have any questions, please contact support.
                    </p>
                    <Link
                      to="/help"
                      className="inline-block mt-2 text-sm font-medium text-orange-700 hover:text-orange-800 underline"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Failed Alert */}
            {order.deliveryFailed && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">Delivery Attempt Unsuccessful</h3>
                    <p className="text-sm text-red-700 mb-3">
                      {order.deliveryFailedReason || 'The delivery attempt was not successful. Please reschedule for a convenient time.'}
                    </p>
                    <button
                      onClick={() => handleRescheduleDelivery()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      Reschedule Delivery
                    </button>
                  </div>
                </div>
              </div>
            )}

              {/* Order Items Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">Order Items ({order.items?.length || 0})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <Link 
                      key={item.id} 
                      to={(item.productSlug && item.productSlug.trim()) ? `/products/${item.productSlug}` : `/products/${item.productId}`}
                      className="block p-4 md:p-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3 md:gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <img src={DEFAULT_IMAGE} alt={item.productName} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">{item.productName}</h3>
                          {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                          {item.variantName && <p className="text-sm text-gray-500 mt-0.5">{item.variantName}</p>}
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                            <span className="text-base md:text-lg font-bold text-gray-900">₹{Number(item.totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {order.status === 'delivered' && (
                <div className="mt-4">
                  <Link
                    to={`/orders/${order.id}/return`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Undo2 className="h-5 w-5" />
                    Request Return
                  </Link>
                </div>
              )}

            {/* Tracking Timeline Card */}
            {(tracking || order.shipmentId || ['shipped', 'processing'].includes(order.status)) && (
              <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">Shipment Tracking</h2>
                  {order.shippingStatus && (
                    <span className="text-sm text-gray-500">
                      Status: {order.shippingStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  )}
                </div>
                
                {tracking?.shipment && (
                  <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    {tracking?.shipment?.courierName && (
                      <div className="text-sm">
                        <span className="text-gray-500">Courier: </span>
                        <span className="font-medium text-gray-900">{tracking?.shipment?.courierName}</span>
                      </div>
                    )}
                    {tracking?.shipment?.awbNumber && (
                      <div className="text-sm">
                        <span className="text-gray-500">AWB: </span>
                        <span className="font-mono text-gray-900">{tracking?.shipment?.awbNumber}</span>
                      </div>
                    )}
                    {tracking?.shipment?.trackingNumber && (
                      <div className="text-sm">
                        <span className="text-gray-500">Tracking: </span>
                        <span className="font-mono text-gray-900">{tracking?.shipment?.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  {tracking?.timeline?.map((event: any, idx: number) => {
                    const isLast = idx === (tracking.timeline?.length || 0) - 1
                    return (
                      <div key={idx} className="flex gap-4 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${isLast ? 'bg-primary-500' : 'bg-green-500'}`}></div>
                          {!isLast && <div className="w-0.5 h-full bg-gray-200 absolute top-3 left-1"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 capitalize">{event.status?.replace(/_/g, ' ') || event.event?.replace(/_/g, ' ')}</span>
                            {event.location && (
                              <span className="text-xs text-gray-500">- {event.location}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </div>
                          {event.remarks && (
                            <p className="text-sm text-gray-600 mt-1">{event.remarks}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Shipping Address Card */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3">Shipping Address</h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  {(() => {
                    let addressDisplay = order.shippingAddress;
                    try {
                      const parsed = JSON.parse(order.shippingAddress);
                      if (parsed.name || parsed.addressLine1) {
                        addressDisplay = [
                          parsed.name,
                          parsed.addressLine1,
                          parsed.addressLine2,
                          parsed.city,
                          parsed.state,
                          parsed.pincode,
                          parsed.country
                        ].filter(Boolean).join(', ');
                      }
                    } catch {}
                    return <p className="text-gray-600">{addressDisplay}</p>;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 sticky top-4">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">₹{Number(order.subtotal || 0).toLocaleString()}</span>
                </div>
                
                {order.items?.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className={`font-medium ${order.shippingAmount == 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {order.shippingAmount == 0 ? 'Free' : `₹${Number(order.shippingAmount || 0).toLocaleString()}`}
                    </span>
                  </div>
                )}
                
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">₹{Number(order.taxAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{Number(order.discountAmount).toLocaleString()}</span>
                  </div>
                )}

                {order.couponCode && (
                  <div className="flex justify-between text-sm text-primary-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Coupon: {order.couponCode}
                    </span>
                    <span className="font-medium">-₹{Number(order.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>100% Authentic Product</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RotateCw className="w-4 h-4 text-blue-500" />
                  <span>Easy 7-day Returns</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>Secure Packaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
