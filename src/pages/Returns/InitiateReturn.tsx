import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/api'
import { ArrowLeft, Package, CheckCircle, AlertCircle, ChevronRight, Info } from 'lucide-react'

const RETURN_REASONS = [
  { value: 'defective', label: 'Product is defective or damaged' },
  { value: 'wrong_item', label: 'Received wrong item' },
  { value: 'damaged', label: 'Item arrived damaged' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other reason' },
]

export default function InitiateReturn() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [selectedReason, setSelectedReason] = useState('')
  const [comments, setComments] = useState('')

  const { data: eligibilityData, isLoading: eligibilityLoading } = useQuery({
    queryKey: ['return-eligibility', orderId],
    queryFn: () => api.get(`/returns/eligibility/${orderId}`),
    enabled: !!orderId,
  })

  const eligibility = eligibilityData?.data || eligibilityData
  const canReturn = eligibility?.eligible === true
  const reasons = eligibility?.reasons || []

  const { data: orderData } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    enabled: !!orderId && canReturn,
  })

  const order = orderData?.data?.data || orderData?.data || orderData
  const items = order?.items || []

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const selectedItemList = Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({ orderItemId: itemId, quantity }))

      if (selectedItemList.length === 0) {
        throw new Error('Please select at least one item to return')
      }

      if (!selectedReason) {
        throw new Error('Please select a reason for return')
      }

      return api.post('/returns/initiate', {
        orderId,
        reason: selectedReason,
        comments,
        items: selectedItemList,
      })
    },
    onSuccess: (data) => {
      toast.success('Return request initiated successfully')
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      const returnData = data?.data || data
      navigate(`/returns/${returnData.id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to initiate return')
    },
  })

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0
      if (current >= maxQty) {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      }
      return { ...prev, [itemId]: maxQty }
    })
  }

  const totalAmount = Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
    const item = items.find((i: any) => i.id === itemId)
    return sum + (item ? Number(item.sellingPrice) * qty : 0)
  }, 0)

  const refundAmount = totalAmount - 3

  if (eligibilityLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!canReturn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center px-4 py-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 ml-2">Initiate Return</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="bg-red-50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 mb-2">Return Not Available</h3>
                <ul className="space-y-1">
                  {reasons.map((reason: string, index: number) => (
                    <li key={index} className="text-sm text-red-700">• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <Link
            to={`/orders/${orderId}`}
            className="block w-full py-3 bg-blue-600 text-white text-center font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Order
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 ml-2">Initiate Return</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Return Policy</p>
              <p>• Returns are only available for online payments (no COD)</p>
              <p>• Returns must be initiated within 7 days of delivery</p>
              <p>• ₹3 will be deducted from refund for return shipping</p>
              <p>• Orders ≤ ₹500 are auto-approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">Select Items to Return</h3>
          <div className="space-y-3">
            {items.map((item: any) => {
              const isSelected = (selectedItems[item.id] || 0) >= item.quantity
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id, item.quantity)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{Number(item.sellingPrice).toFixed(2)}</p>
                  </div>
                  <p className="font-medium">₹{(Number(item.sellingPrice) * item.quantity).toFixed(2)}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">Reason for Return</h3>
          <div className="space-y-2">
            {RETURN_REASONS.map((reason) => (
              <div
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedReason === reason.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedReason === reason.value ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {selectedReason === reason.value && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700">{reason.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">Additional Comments (Optional)</h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Describe the issue or reason in detail..."
            className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
            rows={4}
          />
        </div>

        {Object.keys(selectedItems).length > 0 && selectedReason && (
          <div className="bg-white rounded-xl shadow-sm p-4 fixed bottom-0 left-0 right-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Refund Amount</p>
                <p className="text-xl font-semibold text-green-600">₹{Math.max(0, refundAmount).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">({Object.keys(selectedItems).length} item(s))</p>
                <p className="text-sm text-red-600">-₹3.00 shipping</p>
              </div>
            </div>
            <button
              onClick={() => initiateMutation.mutate()}
              disabled={initiateMutation.isPending}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {initiateMutation.isPending ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Processing...</>
              ) : (
                <>Initiate Return <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}