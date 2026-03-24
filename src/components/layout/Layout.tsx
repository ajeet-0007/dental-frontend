import { Outlet, Link } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Package, Search, Heart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import api from '@/api'
import WishlistDrawer from '@/components/common/WishlistDrawer'

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, logout } = useAuthStore()
  const { items } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => api.get(`/products/search/${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
  })

  const searchData = searchResults?.data || { products: [], categories: [] }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Dentalkart</span>
            </Link>

            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full" ref={searchRef}>
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setIsSearchOpen(true)
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search products, brands, categories..."
                    className="w-full px-5 py-3 pl-12 rounded-full bg-white border-2 border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all duration-200 text-sm placeholder-gray-400 shadow-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setIsSearchOpen(false)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>

                {isSearchOpen && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                    {searchData.categories && searchData.categories.length > 0 && (
                      <div>
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</span>
                        </div>
                        {searchData.categories.map((category: any) => (
                          <Link
                            key={category.id}
                            to={`/products?category=${category.slug}&categoryName=${encodeURIComponent(category.name)}`}
                            onClick={() => {
                              setIsSearchOpen(false)
                              setSearchQuery('')
                            }}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary-600" />
                            </div>
                            <span className="text-gray-800 font-medium">{category.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchData.products && searchData.products.length > 0 && (
                      <div>
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Products</span>
                        </div>
                        {searchData.products.map((product: any) => (
                          <Link
                            key={product.id}
                            to={`/products/${product.slug}`}
                            onClick={() => {
                              setIsSearchOpen(false)
                              setSearchQuery('')
                            }}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                              {product.images?.[0] && (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-800 font-medium block truncate">{product.name}</span>
                              <span className="text-primary-600 font-bold">₹{product.sellingPrice}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {(!searchData.categories || searchData.categories.length === 0) && 
                     (!searchData.products || searchData.products.length === 0) && (
                      <div className="px-5 py-10 text-center">
                        <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No results found</p>
                      </div>
                    )}

                    <Link
                      to={`/products?search=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setIsSearchOpen(false)
                      }}
                      className="flex items-center justify-center gap-2 px-5 py-4 bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors rounded-b-2xl"
                    >
                      View all results
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2 text-gray-600 hover:text-primary-600"
              >
                <Heart className="h-6 w-6" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link to="/profile" className="p-2 text-gray-600 hover:text-primary-600">
                    <User className="h-6 w-6" />
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                      <line x1="12" y1="2" x2="12" y2="12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Login
                </Link>
              )}

              <button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="flex flex-col p-4 space-y-4">
              <Link to="/" className="text-gray-600 hover:text-primary-600">
                Home
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Dentalkart</h3>
              <p className="text-gray-400">
                India's largest online dental e-commerce platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products" className="hover:text-white">Products</Link></li>
                <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
                <li><Link to="/orders" className="hover:text-white">Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@dentalkart.com</li>
                <li>Phone: +91 1234567890</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Dentalkart. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />
    </div>
  )
}
