import { Outlet, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Package, Heart, Mic, MicOff, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import WishlistDrawer from '@/components/common/WishlistDrawer'
import BottomNav from '@/components/common/BottomNav'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import BackButton from '@/components/common/BackButton'
import LogoutModal from '@/components/common/LogoutModal'
import SearchAutocomplete, { type SearchAutocompleteHandle } from '@/components/common/SearchAutocomplete'
import ContactWidget from '@/components/common/ContactWidget'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
// import ChatWidget from '@/pages/Chat/ChatWidget'

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const mobileSearchRef = useRef<SearchAutocompleteHandle>(null)
  const desktopSearchRef = useRef<SearchAutocompleteHandle>(null)
  const { isAuthenticated, logout } = useAuthStore()
  const { items } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const navigate = useNavigate()

  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    lang: 'en-US',
    onResult: (text) => {
      if (text && text.trim()) {
        const trimmedText = text.trim()
        console.log('[Layout] Voice search result:', trimmedText)
        mobileSearchRef.current?.setValue(trimmedText)
        desktopSearchRef.current?.setValue(trimmedText)
        stopListening()
        navigate(`/products?search=${encodeURIComponent(trimmedText)}`)
      }
    },
    onError: (errorMsg) => {
      console.error('[Layout] Voice search error:', errorMsg)
      alert(errorMsg)
    },
  })

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center gap-1 leading-none">
              <img src="/Gemini_Generated_Image_r3bztgr3bztgr3bz.png" alt="Dentzoo" className="h-12 w-auto" />
              <div className="flex flex-col leading-none gap-0">
                <span className="text-xl md:text-3xl font-bold tracking-tight leading-none"><span className="text-blue-900">Dent</span><span className="text-blue-400">zoo</span></span>
                <span className="text-gray-500 text-xs tracking-wider text-right leading-none -mt-0.5 font-semibold">.<span className="text-blue-900">co</span><span className="text-blue-400">m</span></span>
              </div>
            </Link>

            {/* Mobile Search */}
            <div className="flex-1 md:hidden">
              <SearchAutocomplete
                ref={mobileSearchRef}
                variant="mobile"
                placeholder="Search..."
                micButton={
                  isSupported ? (
                    <button
                      onClick={() => {
                        if (isListening) {
                          stopListening()
                        } else {
                          startListening()
                        }
                      }}
                      className={`p-1.5 rounded-full transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isListening ? (
                        <Mic className="h-4 w-4" />
                      ) : (
                        <MicOff className="h-4 w-4" />
                      )}
                    </button>
                  ) : null
                }
              />
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <SearchAutocomplete
                ref={desktopSearchRef}
                variant="desktop"
                placeholder="Search products, brands, categories..."
                micButton={
                  isSupported ? (
                    <button
                      onClick={() => {
                        if (isListening) {
                          stopListening()
                        } else {
                          startListening()
                        }
                      }}
                      className={`p-2 rounded-full transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-voice-pulse'
                          : 'hover:bg-gray-100 text-gray-400'
                      }`}
                      title={isListening ? 'Stop listening' : 'Voice search'}
                    >
                      {isListening ? (
                        <Mic className="h-5 w-5" />
                      ) : (
                        <MicOff className="h-5 w-5" />
                      )}
                    </button>
                  ) : null
                }
              />
            </div>

            <div className="flex items-center space-x-1 md:space-x-4">
              {/* Desktop: Cart, Wishlist, User */}
              <div className="hidden md:flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 inline-block" title="Cart">
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
                  title="Wishlist"
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
                      <Link to="/profile" className="p-2 text-gray-600 hover:text-primary-600 inline-block" title="Account">
                        <User className="h-6 w-6" />
                      </Link>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowLogoutModal(true)}
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
                title={isMenuOpen ? "Close menu" : "Menu"}
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
                        setShowLogoutModal(true)
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

      <BackButton />
      <Breadcrumbs />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <BottomNav />

      <footer className="hidden md:block bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900 text-white pt-16 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-slate-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-slate-600 rounded-full blur-[128px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/Gemini_Generated_Image_r3bztgr3bztgr3bz.png" alt="Dentzoo" className="h-8 w-auto md:h-12" />
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                India's most trusted dental e-commerce platform. Quality products, competitive prices, and reliable delivery for dental professionals nationwide.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { icon: Instagram, href: 'https://www.instagram.com/dent.zoo?igsh=MTY4eHJzdzhrZ2hlaA%3D%3D', label: 'Instagram' },
                  { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61592577323923', label: 'Facebook' },
                  { icon: Twitter, href: 'https://x.com/Dentzooo', label: 'Twitter' },
                  { icon: Youtube, href: 'https://www.youtube.com/@Dentzoo', label: 'YouTube' },
                  { icon: Linkedin, href: 'https://www.linkedin.com/in/dentzoo-india-b18a66424/', label: 'LinkedIn' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 bg-white/10 hover:bg-primary-500 border border-white/10 hover:border-primary-500 rounded-lg flex items-center justify-center transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary-500 to-blue-500 rounded-full" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Products', href: '/products' },
                  { label: 'Categories', href: '/categories' },
                  { label: 'Brands', href: '/brands' },
                  { label: 'Departments', href: '/departments' },
                  { label: 'Gallery', href: '/gallery' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-gray-300 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary-500 to-blue-500 rounded-full" />
                Account
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'My Account', href: '/account' },
                  { label: 'My Orders', href: '/orders' },
                  { label: 'Wishlist', href: '/wishlist' },
                  { label: 'Returns', href: '/returns' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-gray-300 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary-500 to-blue-500 rounded-full" />
                Contact Us
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Bareilly, UP, India</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <a href="tel:+918979353136" className="text-gray-300 hover:text-white text-sm transition-colors">
                    +91 8979353136
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <a href="mailto:support@dentzoo.com" className="text-gray-300 hover:text-white text-sm transition-colors">
                      support@dentzoo.com
                    </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                {[
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Shipping Policy', href: '#' },
                  { label: 'Return Policy', href: '#' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} className="hover:text-white transition-colors">
                    {label}
                  </a>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                © 2026 Dentzoo. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />

      {/* <ChatWidget /> */}
      <ContactWidget />
    </div>
  )
}
