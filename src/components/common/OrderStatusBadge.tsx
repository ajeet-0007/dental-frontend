import { Package, Truck, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface OrderStatusBadgeProps {
  orderStatus: string
  shipmentStatus?: string | null
  isRTO?: boolean
  deliveryFailed?: boolean
  size?: 'sm' | 'md' | 'lg'
  showShipmentDetail?: boolean
}

const ORDER_STATUS_CONFIG: Record<string, {
  bg: string
  text: string
  border: string
  icon: any
  label: string
}> = {
  pending_payment: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    icon: AlertCircle,
    label: 'Payment Pending',
  },
  pending: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: Clock,
    label: 'Pending',
  },
  confirmed: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    icon: CheckCircle,
    label: 'Confirmed',
  },
  processing: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    icon: Package,
    label: 'Processing',
  },
  shipped: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    icon: Truck,
    label: 'Shipped',
  },
  delivered: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    icon: CheckCircle,
    label: 'Delivered',
  },
  cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: XCircle,
    label: 'Cancelled',
  },
  refunded: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    icon: CheckCircle,
    label: 'Refunded',
  },
  payment_failed: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: XCircle,
    label: 'Payment Failed',
  },
  rto: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    icon: RefreshCw,
    label: 'Return to Origin',
  },
  delivery_failed: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: XCircle,
    label: 'Delivery Failed',
  },
}

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting pickup',
  processing: 'Processing at warehouse',
  picked_up: 'Picked up by courier',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery failed',
  rto: 'Return to origin',
  cancelled: 'Cancelled',
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-0.5 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-2.5 py-1 text-sm',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4',
  },
}

export default function OrderStatusBadge({
  orderStatus,
  shipmentStatus,
  isRTO,
  deliveryFailed,
  size = 'md',
  showShipmentDetail = false,
}: OrderStatusBadgeProps) {
  // Determine effective status
  let effectiveStatus = orderStatus
  let effectiveLabel = ORDER_STATUS_CONFIG[orderStatus]?.label || orderStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  if (isRTO) {
    effectiveStatus = 'rto'
    effectiveLabel = 'Return to Origin'
  } else if (deliveryFailed) {
    effectiveStatus = 'delivery_failed'
    effectiveLabel = 'Delivery Failed'
  }

  const config = ORDER_STATUS_CONFIG[effectiveStatus] || ORDER_STATUS_CONFIG.pending
  const Icon = config.icon
  const sizeClass = sizeClasses[size]

  const shipmentLabel = showShipmentDetail && shipmentStatus
    ? SHIPMENT_STATUS_LABELS[shipmentStatus] || shipmentStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${sizeClass.container}`}
      >
        <Icon className={sizeClass.icon} />
        <span>{effectiveLabel}</span>
      </div>

      {shipmentLabel && (
        <div className="text-xs text-gray-500 ml-1">
          {shipmentLabel}
        </div>
      )}
    </div>
  )
}

export function getStatusColor(status: string): string {
  return ORDER_STATUS_CONFIG[status]?.text || 'text-gray-600'
}

export function getStatusBgColor(status: string): string {
  return ORDER_STATUS_CONFIG[status]?.bg || 'bg-gray-50'
}

export function getStatusLabel(status: string): string {
  return ORDER_STATUS_CONFIG[status]?.label || status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
}

export function getShipmentStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return SHIPMENT_STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
}