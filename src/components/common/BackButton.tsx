import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const rootPaths = ['/', '/products', '/cart', '/orders', '/returns', '/profile', '/wishlist', '/help', '/gallery', '/departments', '/brands', '/categories']

export default function BackButton() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isRoot = rootPaths.includes(pathname)
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isAdmin = pathname.startsWith('/admin')

  if (isRoot || isAuthPage || isAdmin) return null

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(-1)}
      className="fixed top-20 left-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all text-sm text-gray-700 md:hidden"
      aria-label="Go back"
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden xs:inline">Back</span>
    </motion.button>
  )
}
