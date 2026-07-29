import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const labelMap: Record<string, string> = {
  products: 'Products',
  cart: 'Cart',
  checkout: 'Checkout',
  orders: 'My Orders',
  returns: 'Returns',
  profile: 'Profile',
  wishlist: 'Wishlist',
  help: 'Help & Support',
  gallery: 'Gallery',
  departments: 'Departments',
  brands: 'Brands',
  categories: 'Categories',
  login: 'Login',
  register: 'Register',
}

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const isAdmin = segments[0] === 'admin'
  if (isAdmin) return null

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const label = labelMap[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const isLast = i === segments.length - 1
    return { path, label, isLast }
  })

  return (
    <nav className="container mx-auto px-4 py-3" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <li>
          <Link to="/" className="hover:text-primary-600 transition-colors inline-flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            {crumb.isLast ? (
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-primary-600 transition-colors truncate max-w-[180px]">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
