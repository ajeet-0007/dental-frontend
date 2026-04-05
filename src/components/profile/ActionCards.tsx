import { ShoppingBag, Heart, MapPin, HelpCircle, ChevronRight } from 'lucide-react'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string | number
  onClick?: () => void
}

function ActionCard({ icon, title, description, badge, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-md transition-all duration-200 text-left"
    >
      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
    </button>
  )
}

interface ActionCardsProps {
  orderCount?: number
  wishlistCount?: number
  addressCount?: number
  onOrdersClick?: () => void
  onWishlistClick?: () => void
  onAddressesClick?: () => void
  onHelpClick?: () => void
}

export default function ActionCards({
  orderCount = 0,
  wishlistCount = 0,
  addressCount = 0,
  onOrdersClick,
  onWishlistClick,
  onAddressesClick,
  onHelpClick,
}: ActionCardsProps) {
  const cards = [
    {
      icon: <ShoppingBag className="h-6 w-6 text-primary-600" />,
      title: 'My Orders',
      description: 'Track your orders, view history and download invoices',
      badge: orderCount > 0 ? `${orderCount} Orders` : undefined,
      onClick: onOrdersClick,
    },
    {
      icon: <Heart className="h-6 w-6 text-red-500" />,
      title: 'My Wishlist',
      description: 'Buy from items you saved for later',
      badge: wishlistCount > 0 ? wishlistCount : undefined,
      onClick: onWishlistClick,
    },
    {
      icon: <MapPin className="h-6 w-6 text-green-600" />,
      title: 'My Addresses',
      description: 'Manage your saved delivery addresses',
      badge: addressCount > 0 ? addressCount : undefined,
      onClick: onAddressesClick,
    },
    {
      icon: <HelpCircle className="h-6 w-6 text-blue-600" />,
      title: 'Help & Support',
      description: 'FAQs, contact us and more',
      onClick: onHelpClick,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <ActionCard
          key={index}
          icon={card.icon}
          title={card.title}
          description={card.description}
          badge={card.badge}
          onClick={card.onClick}
        />
      ))}
    </div>
  )
}
