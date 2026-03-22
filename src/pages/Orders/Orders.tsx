import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api'
import { Package, X } from 'lucide-react'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-purple-100 text-purple-800'
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800'
      case 'payment_failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Payment Pending'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Please login to view orders</h2>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Login
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                    <div className="flex justify-between mt-4">
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                      </div>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-20 w-20 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">No orders yet</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {orders.map((order: any, index: number) => (
              <div 
                key={order.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  index !== orders.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex gap-2 flex-shrink-0 overflow-x-auto pb-1">
                    {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                      </div>
                    ))}
                    {(order.items?.length || 0) > 4 && (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-500 font-medium">
                        +{(order.items?.length || 0) - 4} more
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-semibold text-sm">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm font-semibold">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                      <div className="flex-1"></div>
                      <div className="flex gap-2">
                        {canCancel(order.status) && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={cancellingId !== null}
                            className="text-xs text-red-600 hover:text-red-800 px-3 py-1.5 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="text-xs text-primary-600 hover:text-primary-800 px-3 py-1.5 border border-primary-200 rounded hover:bg-primary-50"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmCancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cancel Order</h3>
              <button 
                onClick={() => setConfirmCancelId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  cancelMutation.mutate(confirmCancelId)
                  setConfirmCancelId(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
