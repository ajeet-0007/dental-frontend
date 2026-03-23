import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Package, MapPin, CheckCircle, Loader2, RefreshCw } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-white rounded-lg shadow"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-4 border-b pb-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    <div className="h-6 bg-gray-200 rounded w-full mt-4"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <Link to="/orders" className="text-primary-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending_payment: 'bg-orange-100 text-orange-800',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    payment_failed: 'bg-red-100 text-red-800',
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Payment Pending'
      case 'payment_failed': return 'Payment Failed'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>
        <button
          onClick={fetchOrder}
          disabled={verifying}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
            {getStatusText(order.status)}
          </span>
        </div>
      </div>

      {verifying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
          <span className="text-yellow-800">Verifying payment with Stripe...</span>
        </div>
      )}

      {!verifying && sessionId && order.status !== 'pending_payment' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Payment successful! Your order has been confirmed.</span>
        </div>
      )}

      {order.status === 'pending_payment' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 text-center">
          <Package className="h-12 w-12 mx-auto text-orange-400 mb-3" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Payment Verification Needed</h3>
          <p className="text-orange-600 mb-4">
            Click below to verify your payment and confirm the order.
          </p>
          <button
            onClick={() => sessionId && verifyPayment(sessionId)}
            disabled={verifying}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify Payment Now'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <img src={DEFAULT_IMAGE} alt={item.productName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.productName}</h3>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="font-semibold">₹{item.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{order.shippingAmount == 0 ? 'Free' : `₹${order.shippingAmount}`}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <p className="text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
