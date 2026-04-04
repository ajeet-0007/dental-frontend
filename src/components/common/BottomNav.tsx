import { Link, useLocation } from 'react-router-dom'
import { Home, Package, ShoppingCart, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/cart', icon: ShoppingCart, label: 'Cart' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { items } = useCartStore()

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          if (item.path === '/profile' && !isAuthenticated) {
            return (
              <Link
                key={item.path}
                to="/login"
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 rounded-xl transition-colors ${active ? 'text-primary-600' : 'text-gray-500'}`}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span className={`text-[11px] font-medium mt-0.5 ${active ? 'text-primary-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`relative p-2.5 rounded-xl transition-colors ${active ? 'text-primary-600' : 'text-gray-500'}`}
                >
                  <Icon className="w-6 h-6" />
                  {item.path === '/cart' && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shadow-sm"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
              <span className={`text-[11px] font-medium mt-0.5 ${active ? 'text-primary-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
