import { User, MapPin, ShoppingBag, Heart, HelpCircle, LogOut, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function ProfileBottomSheet({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
}: BottomSheetProps) {
  const { user, logout } = useAuthStore()

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  const menuItems = [
    { id: 'overview', icon: User, label: 'My Profile' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders' },
    { id: 'addresses', icon: MapPin, label: 'My Addresses' },
    { id: 'wishlist', icon: Heart, label: 'My Wishlist' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support' },
  ]

  const handleMenuClick = (section: string) => {
    onSectionChange(section)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[85vh] overflow-hidden animate-slideUp">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">
                {getInitials()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronUp className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-2 max-h-[50vh] overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${isActive ? 'text-primary-600' : 'text-gray-900'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={() => {
              logout()
              onClose()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
