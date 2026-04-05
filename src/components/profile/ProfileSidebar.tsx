import { X, User, MapPin, ShoppingBag, Heart, HelpCircle, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function ProfileSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
}: ProfileSidebarProps) {
  const { user } = useAuthStore()

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  const menuItems = [
    { id: 'overview', icon: User, label: 'My Profile', description: 'View and edit profile' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders', description: 'Track your orders' },
    { id: 'addresses', icon: MapPin, label: 'My Addresses', description: 'Manage saved addresses' },
    { id: 'wishlist', icon: Heart, label: 'My Wishlist', description: 'Items you saved' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', description: 'FAQs and contact' },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-full md:max-w-none md:h-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <h2 className="font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Profile Summary */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">
                {getInitials()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id)
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className={`font-medium ${isActive ? 'text-primary-600' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Settings Link */}
        <div className="p-4 border-t mt-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">Settings</span>
          </button>
        </div>
      </div>
    </>
  )
}
