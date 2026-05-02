import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  CheckCircle, 
  Truck, 
  XCircle, 
  ChevronRight,
  RotateCcw, 
  Loader2,
  ArrowRight,
  Calendar
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
  onReorder: (orderId: string) => void
  reorderingId: string | null
}

export default function OrderCard({
  order,
  statusConfig,
  timeline,
  StatusIcon,
  index,
  onReorder,
  reorderingId,
}: OrderCardProps) {
  const navigate = useNavigate()
  const [trackingExpanded, setTrackingExpanded] = useState(false)
  const completedSteps = timeline.filter(step => step.completed && !step.cancelled).length

  return (
    <motion.div 
      onClick={() => navigate(`/orders/${order.id}`)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Order Header */}
      <div className="px-4 md:px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 truncate">Order #{order.orderNumber}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="text-gray-300">•</span>
                <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold text-gray-900">₹{Number(order.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="divide-y divide-gray-50">
        {(order.items || []).slice(0, 2).map((item: any, idx: number) => (
          <a 
            key={idx} 
            href={(item.productSlug && item.productSlug.trim()) ? `/products/${item.productSlug}` : `/products/${item.productId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-gray-50/50 transition-colors"
          >
            <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
              {item.productImage ? (
                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity || 1}</p>
            </div>
          </a>
        ))}
        {(order.items?.length || 0) > 2 && (
          <div className="px-4 md:px-5 py-2.5 text-xs font-medium text-primary-600 bg-primary-50/30">
            +{(order.items?.length || 0) - 2} more item{(order.items?.length || 0) - 2 !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Desktop - Horizontal Timeline */}
      <div className="hidden sm:block px-4 md:px-5 py-3 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {timeline.map((step: any, idx: number) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.cancelled 
                    ? 'bg-red-100 text-red-500' 
                    : step.completed 
                      ? `${statusConfig.bg} ${statusConfig.text}`
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
                <span className={`text-[10px] mt-1 font-medium ${
                  step.cancelled || step.active ? 'text-gray-700' : 'text-gray-400'
                }`}>{step.label}</span>
              </div>
              {idx < timeline.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-300 ${
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
          onClick={(e) => { e.stopPropagation(); setTrackingExpanded(!trackingExpanded) }}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-900">{statusConfig.label}</p>
              <p className="text-[10px] text-gray-500">{completedSteps}/{timeline.length} steps</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-all duration-300 ${trackingExpanded ? 'rotate-90' : ''}`} />
        </button>
        
        <motion.div 
          initial={false}
          animate={{ height: trackingExpanded ? 'auto' : 0, opacity: trackingExpanded ? 1 : 0 }}
          className="overflow-hidden bg-gray-50/50"
        >
          <div className="px-4 pb-2.5 space-y-0">
            {timeline.map((step: any) => (
              <div key={step.key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    step.cancelled 
                      ? 'bg-red-100 text-red-500' 
                      : step.completed 
                        ? `${statusConfig.bg} ${statusConfig.text}`
                        : step.active
                          ? `${statusConfig.bg} ${statusConfig.text} ring-2 ring-offset-1 ${statusConfig.text.replace('text-', 'ring-')}`
                          : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.cancelled ? (
                      <XCircle className="w-3 h-3" />
                    ) : step.completed ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <step.icon className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    step.cancelled || step.completed || step.active ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {step.active && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Order Actions */}
      <div className="px-4 md:px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {order.status === 'shipped' && (
            <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Truck className="w-3.5 h-3.5" />
              Track
            </button>
          )}
          {order.status === 'delivered' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onReorder(order.id) }}
              disabled={reorderingId !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
            >
              {reorderingId === order.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              {reorderingId === order.id ? 'Adding...' : 'Reorder'}
            </button>
          )}
        </div>
        <a
          href={`/orders/${order.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all"
        >
          Details
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  )
}
