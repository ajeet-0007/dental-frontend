import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, MapPin, CheckCircle, Loader2, RefreshCw, Clock, Truck, XCircle, AlertCircle, ShieldCheck, RotateCw, Tag } from 'lucide-react'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop'

export default function OrderDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const verificationRef = useRef(false)

  const fetchOrder = useCallback(async () => {
    console.log('[OrderDetail] fetchOrder called with id:', id)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await res.json()
      console.log('[OrderDetail] Full response:', JSON.stringify(data, null, 2))
      console.log('[OrderDetail] Response status:', res.status)
      
      if (data.data) {
        setOrder(data.data)
      } else if (data) {
        setOrder(data)
      } else {
        console.error('[OrderDetail] No data in response:', data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('session_id')
    const paymentStatus = params.get('payment')
    console.log('[OrderDetail] URL params - sessionId:', sid, 'payment:', paymentStatus)
    
    setSessionId(sid)
    fetchOrder()
    
    if (sid) {
      verifyPayment(sid)
    }
    
    if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled.')
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="animate-pulse space-y-4 md:space-y-6">
            <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-white rounded-2xl shadow-sm animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 animate-pulse">
                  <div className="h-6 bg-gray-100 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3 md:gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 animate-pulse">
                  <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                    <div className="h-6 bg-gray-100 rounded w-full mt-4 pt-4 border-t"></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 animate-pulse">
                  <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Delivered' }
      case 'cancelled':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: XCircle, label: 'Cancelled' }
      case 'shipped':
        return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Truck, label: 'Shipped' }
      case 'confirmed':
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: Clock, label: 'Confirmed' }
      case 'processing':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Clock, label: 'Processing' }
      case 'pending_payment':
        return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: AlertCircle, label: 'Payment Pending' }
      case 'payment_failed':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: XCircle, label: 'Payment Failed' }
      default:
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: status.charAt(0).toUpperCase() + status.slice(1) }
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

              {/* Order Items Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">Order Items ({order.items?.length || 0})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <Link 
                      key={item.id} 
                      to={item.productSlug ? `/products/${item.productSlug}` : `/products/${item.productId}`}
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

            {/* Shipping Address Card */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3">Shipping Address</h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <p className="text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
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
