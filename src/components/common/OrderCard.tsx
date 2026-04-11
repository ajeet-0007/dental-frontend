import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  CheckCircle, 
  Truck, 
  XCircle, 
  ChevronRight,
  RotateCcw, 
  FileText, 
  Loader2
} from 'lucide-react'

interface OrderCardProps {
  order: any
  statusConfig: {
    bg: string
    text: string
    icon: any
    label: string
    dot: string
  }
  timeline: any[]
  StatusIcon: any
  index: number
  onCancel: (orderId: string) => void
  cancellingId: string | null
  onReorder: (orderId: string) => void
  reorderingId: string | null
}

export default function OrderCard({
  order,
  statusConfig,
  timeline,
  StatusIcon,
  index,
  onCancel,
  cancellingId,
  onReorder,
  reorderingId,
}: OrderCardProps) {
  const [trackingExpanded, setTrackingExpanded] = useState(false)
  const completedSteps = timeline.filter(step => step.completed && !step.cancelled).length

  const canCancel = (status: string) => {
    return ['pending', 'pending_payment', 'confirmed', 'processing'].includes(status)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden hover:shadow-xl hover:shadow-gray-300/30 transition-all duration-300"
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

      {/* Desktop - Horizontal Timeline */}
      <div className="hidden sm:block px-5 md:px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
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
                      ? statusConfig.dot
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
        
        <motion.div 
          initial={false}
          animate={{ height: trackingExpanded ? 'auto' : 0, opacity: trackingExpanded ? 1 : 0 }}
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
      </div>

      {/* Products Preview */}
      <div className="p-5 md:p-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
          {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
            <Link 
              key={idx} 
              to={(item.productSlug && item.productSlug.trim()) ? `/products/${item.productSlug}` : `/products/${item.productId}`}
              className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-primary-300 hover:shadow-lg transition-all duration-300"
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
              onClick={() => onReorder(order.id)}
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
                onClick={() => onCancel(order.id)}
                disabled={cancellingId !== null}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
          <button
            onClick={() => window.location.href = `/orders/${order.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}