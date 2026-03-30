import { Outlet, Link } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Package, Search, Heart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  const searchData = searchResults?.data || { products: [], categories: [], brands: [] }

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
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Dentalkart</span>
            </Link>

            {/* Mobile Search */}
            <div className="flex-1 md:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.length >= 2) {
                      setIsSearchOpen(true)
                    } else {
                      setIsSearchOpen(false)
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setIsSearchOpen(true)
                    }
                  }}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 pl-8 pr-8 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setIsSearchOpen(false)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Search */}
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

                <AnimatePresence>
                  {isSearchOpen && searchQuery.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto"
                    >
                      {searchData.categories && searchData.categories.length > 0 && (
                        <div>
                          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</span>
                          </div>
                          {searchData.categories.map((category: any, index: number) => (
                            <motion.div
                              key={category.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Link
                                to={`/products?category=${category.slug}&categoryName=${encodeURIComponent(category.name)}`}
                                onClick={() => {
                                  setIsSearchOpen(false)
                                  setSearchQuery('')
                                }}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
                              >
                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden">
                                  {category.image ? (
                                    <img src={category.image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="h-5 w-5 text-primary-600" />
                                  )}
                                </div>
                                <span className="text-gray-800 font-medium">{category.name}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {searchData.brands && searchData.brands.length > 0 && (
                        <div>
                          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Brands</span>
                          </div>
                          {searchData.brands.map((brand: any, index: number) => (
                            <motion.div
                              key={brand.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Link
                                to={`/products?brand=${brand.slug}`}
                                onClick={() => {
                                  setIsSearchOpen(false)
                                  setSearchQuery('')
                                }}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
                              >
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center overflow-hidden">
                                  {brand.logo ? (
                                    <img src={brand.logo} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <Package className="h-5 w-5 text-orange-600" />
                                  )}
                                </div>
                                <span className="text-gray-800 font-medium">{brand.name}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {searchData.products && searchData.products.length > 0 && (
                        <div>
                          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Products</span>
                          </div>
                          {searchData.products.map((product: any, index: number) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Link
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
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {(!searchData.categories || searchData.categories.length === 0) && 
                       (!searchData.products || searchData.products.length === 0) &&
                       (!searchData.brands || searchData.brands.length === 0) && (
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center space-x-1 md:space-x-4">
              {/* Desktop: Cart, Wishlist, User */}
              <div className="hidden md:flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 inline-block">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsWishlistOpen(true)}
                  className="relative p-2 text-gray-600 hover:text-primary-600"
                >
                  <Heart className="h-6 w-6" />
                  {wishlistItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      {wishlistItems.length}
                    </motion.span>
                  )}
                </motion.button>

                {isAuthenticated ? (
                  <>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Link to="/profile" className="p-2 text-gray-600 hover:text-primary-600 inline-block">
                        <User className="h-6 w-6" />
                      </Link>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={logout}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Logout"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                      </svg>
                    </motion.button>
                  </>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Login
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Mobile: Hamburger Menu */}
              <motion.button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMenuOpen ? <X /> : <Menu />}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden bg-white"
            >
              <div className="p-4 space-y-3">
                {/* Cart */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <Link
                    to="/cart"
                    className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">Cart</span>
                    </div>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* Wishlist */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsWishlistOpen(true)
                    }}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">Wishlist</span>
                    </div>
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      >
                        {wishlistItems.length}
                      </motion.span>
                    )}
                  </button>
                </motion.div>

                {/* User/Login */}
                {isAuthenticated ? (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-1"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                      </svg>
                      <span className="text-gray-700">Logout</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Link
                      to="/login"
                      className="block text-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </motion.div>
                )}

                {/* Navigation Links */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 border-t space-y-1"
                >
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="h-5 w-5" />
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Products
                  </Link>
                  <Link
                    to="/departments"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Departments
                  </Link>
                  <Link
                    to="/brands"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Brands
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    My Orders
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Search Dropdown */}
      <AnimatePresence>
        {isSearchOpen && searchQuery.length >= 2 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[99] md:hidden"
              onClick={() => {
                setIsSearchOpen(false)
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 left-0 right-0 md:hidden bg-white shadow-lg z-[100] max-h-[60vh] overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-2">
                {searchData.categories && searchData.categories.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Categories</p>
                    {searchData.categories.map((category: any) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${category.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className="flex items-center gap-3 py-2 hover:text-primary-600"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {category.image ? (
                            <img src={category.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-primary-500 p-1" />
                          )}
                        </div>
                        <span>{category.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchData.brands && searchData.brands.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Brands</p>
                    {searchData.brands.map((brand: any) => (
                      <Link
                        key={brand.id}
                        to={`/products?brand=${brand.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className="flex items-center gap-3 py-2 hover:text-primary-600"
                      >
                        <div className="w-8 h-8 bg-orange-100 rounded overflow-hidden">
                          {brand.logo ? (
                            <img src={brand.logo} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Package className="h-5 w-5 text-orange-500 p-1" />
                          )}
                        </div>
                        <span>{brand.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchData.products && searchData.products.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Products</p>
                    {searchData.products.map((product: any) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className="flex items-center gap-3 py-2 hover:text-primary-600"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-sm text-primary-600 font-bold">₹{product.sellingPrice}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {(!searchData.categories?.length && !searchData.products?.length && !searchData.brands?.length) && (
                  <p className="text-center py-4 text-gray-500">No results found</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                <li><Link to="/departments" className="hover:text-white">Departments</Link></li>
                <li><Link to="/brands" className="hover:text-white">Brands</Link></li>
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
