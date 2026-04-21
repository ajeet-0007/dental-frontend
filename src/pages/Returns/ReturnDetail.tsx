import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/api'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle, Truck, RefreshCw, Calendar, MapPin, Phone } from 'lucide-react'

const RETURN_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  requested: { label: 'Requested', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  pending_review: { label: 'Under Review', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
  scheduled: { label: 'Pickup Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Calendar },
  picked_up: { label: 'Picked Up', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Package },
  in_transit: { label: 'In Transit', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Truck },
  received: { label: 'Received', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  quality_check: { label: 'Quality Check', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'text-green-600', bgColor: 'bg-green-50', icon: RefreshCw },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: XCircle },
}

const TIMELINE_ACTIONS: Record<string, string> = {
  return_initiated: 'Return Initiated',
  return_approved: 'Return Approved',
  return_rejected: 'Return Rejected',
  return_cancelled: 'Return Cancelled',
  label_generated: 'Return Label Generated',
  pickup_scheduled: 'Pickup Scheduled',
  pickup_completed: 'Package Picked Up',
  in_transit: 'In Transit to Warehouse',
  received_at_warehouse: 'Received at Warehouse',
  quality_check_passed: 'Quality Check Passed',
  quality_check_failed: 'Quality Check Failed',
  refund_initiated: 'Refund Initiated',
  refund_completed: 'Refund Completed',
  images_uploaded: 'Images Uploaded',
  rescheduled: 'Pickup Rescheduled',
}

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['return', id],
    queryFn: () => api.get(`/returns/${id}`),
    enabled: !!id,
  })

  const returnData = data?.data || data

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/returns/${id}/cancel`, { reason: cancelReason })
    },
    onSuccess: () => {
      toast.success('Return cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['return', id] })
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      setShowCancelModal(false)
    },
    onError: () => {
      toast.error('Failed to cancel return')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !returnData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Return not found</h2>
        <Link to="/returns" className="text-blue-600 hover:underline">
          Back to Returns
        </Link>
      </div>
    )
  }

  const config = RETURN_STATUS_CONFIG[returnData.status] || RETURN_STATUS_CONFIG.requested
  const StatusIcon = config.icon

  const canCancel = ['requested', 'pending_review'].includes(returnData.status)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button onClick={() => navigate('/returns')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 ml-2">Return Details</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Return ID</p>
              <p className="font-medium text-gray-900">#{returnData.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
              <StatusIcon className={`h-4 w-4 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order Number</p>
              <p className="font-medium">{returnData.order?.orderNumber || returnData.orderNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Initiated On</p>
              <p className="font-medium">
                {new Date(returnData.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Reason</p>
              <p className="font-medium capitalize">{returnData.reason?.replace(/_/g, ' ') || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Comments</p>
              <p className="font-medium">{returnData.comments || 'None'}</p>
            </div>
          </div>
        </div>

        {returnData.items?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3">Return Items</h3>
            <div className="space-y-3">
              {returnData.items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                      <span className="text-sm text-gray-600">×</span>
                      <span className="text-sm font-medium">₹{Number(item.unitPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{Number(item.totalPrice).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Item Total</span>
                <span className="font-medium">₹{Number(returnData.itemTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Return Shipping (Deduction)</span>
                <span className="text-red-600">-₹{Number(returnData.shippingDeduction || 3).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
                <span>Refund Amount</span>
                <span className="text-green-600">₹{Number(returnData.refundAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {returnData.pickupAddress && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3">Pickup Details</h3>
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-gray-900">{returnData.pickupAddress}</p>
                <p className="text-gray-500">
                  {returnData.pickupCity}, {returnData.pickupState} - {returnData.pickupPincode}
                </p>
                {returnData.pickupPhone && (
                  <p className="flex items-center gap-1 mt-1 text-gray-500">
                    <Phone className="h-3 w-3" /> {returnData.pickupPhone}
                  </p>
                )}
              </div>
            </div>
            {returnData.pickupScheduledDate && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Pickup scheduled for{' '}
                  {new Date(returnData.pickupScheduledDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {returnData.returnAwbNumber && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-3">Tracking Information</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">AWB Number</p>
                <p className="font-medium">{returnData.returnAwbNumber}</p>
              </div>
              {returnData.returnLabelUrl && (
                <a
                  href={returnData.returnLabelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Label
                </a>
              )}
            </div>
          </div>
        )}

        {returnData.timeline?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-4">Timeline</h3>
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {returnData.timeline
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((event: any, index: number) => (
                    <div key={event.id || index} className="relative flex gap-3 pl-6">
                      <div className="absolute left-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {TIMELINE_ACTIONS[event.action] || event.action}
                        </p>
                        {event.comment && <p className="text-xs text-gray-500 mt-0.5">{event.comment}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {canCancel && (
          <div className="pt-4">
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-3 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
            >
              Cancel Return
            </button>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Cancel Return?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this return request? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Return
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}