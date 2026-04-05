import { ShoppingBag, Heart, MapPin } from 'lucide-react'

interface StatItemProps {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
  onClick?: () => void
}

function StatItem({ icon, value, label, color, onClick }: StatItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs md:text-sm text-gray-500">{label}</p>
      </div>
    </button>
  )
}

interface QuickStatsProps {
  orderCount?: number
  wishlistCount?: number
  addressCount?: number
  onOrdersClick?: () => void
  onWishlistClick?: () => void
  onAddressesClick?: () => void
}

export default function QuickStats({
  orderCount = 0,
  wishlistCount = 0,
  addressCount = 0,
  onOrdersClick,
  onWishlistClick,
  onAddressesClick,
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <StatItem
        icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
        value={orderCount}
        label="Orders"
        color="bg-blue-50"
        onClick={onOrdersClick}
      />
      <StatItem
        icon={<Heart className="h-5 w-5 text-red-500" />}
        value={wishlistCount}
        label="Wishlist"
        color="bg-red-50"
        onClick={onWishlistClick}
      />
      <StatItem
        icon={<MapPin className="h-5 w-5 text-green-600" />}
        value={addressCount}
        label="Addresses"
        color="bg-green-50"
        onClick={onAddressesClick}
      />
    </div>
  )
}
