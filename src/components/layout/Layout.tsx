import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Package, Heart, Mic, MicOff, Mail, Phone, MapPin, Info, Wrench, LayoutGrid, Tags, Sparkles, HelpCircle, RotateCcw, LogOut, FileImage } from 'lucide-react'
import { Suspense, useState, useRef, useEffect } from 'react'
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
import { ADDRESS_INLINE, COMPANY } from '@/constants/company'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
// import ChatWidget from '@/pages/Chat/ChatWidget'

const drawerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}

const drawerItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
}

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const mobileSearchRef = useRef<SearchAutocompleteHandle>(null)
  const desktopSearchRef = useRef<SearchAutocompleteHandle>(null)
  const { isAuthenticated, logout, user } = useAuthStore()
  const { items } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const navigate = useNavigate()
  const location = useLocation()

  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    closeMenu()
  }, [location.pathname])

  useEffect(() => {
    if (!isMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isMenuOpen])

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

  const shopLinks = [
    { to: '/departments', label: 'Departments', Icon: LayoutGrid },
    { to: '/categories', label: 'Categories', Icon: Tags },
    { to: '/brands', label: 'Brands', Icon: Sparkles },
    { to: '/free-advice', label: 'Free Equipment Advice', Icon: Wrench },
    { to: '/gallery', label: 'Gallery', Icon: FileImage },
  ]

  const accountLinks = [
    { to: '/orders', label: 'My Orders', Icon: Package },
    { to: '/returns', label: 'Returns', Icon: RotateCcw },
  ]

  const supportLinks = [
    { to: '/help', label: 'Help & Support', Icon: HelpCircle },
    { to: '/about', label: 'About Us', Icon: Info },
  ]

  const drawerLinkClass =
    'flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 active:bg-gray-100 transition-colors'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          {/* Mobile row 1: compact logo + wishlist / cart / account / menu */}
          <div className="md:hidden">
            <div className="flex items-center justify-between h-14 pl-4 pr-1.5 gap-2">
              <Link to="/" className="flex items-center gap-1.5 leading-none min-w-0">
                <img src="/dentzoo-logo.png" alt="Dentzoo" width="240" height="190" className="h-8 w-auto shrink-0" />
                <span className="text-lg font-bold tracking-tight leading-none whitespace-nowrap">
                  <span className="text-blue-900">Dent</span>
                  <span className="text-blue-400">zoo</span>
                </span>
              </Link>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setIsWishlistOpen(true)}
                  className="relative p-2 rounded-full text-gray-600 active:bg-gray-100 transition-colors"
                  aria-label={`Wishlist, ${wishlistItems.length} items`}
                >
                  <Heart className="h-6 w-6" />
                  {wishlistItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center"
                    >
                      {wishlistItems.length}
                    </motion.span>
                  )}
                </button>

                <Link
                  to="/cart"
                  className="relative p-2 rounded-full text-gray-600 active:bg-gray-100 transition-colors"
                  aria-label={`Cart, ${cartCount} items`}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    className="p-2 rounded-full text-gray-600 active:bg-gray-100 transition-colors"
                    aria-label="Your account"
                  >
                    <User className="h-6 w-6" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="ml-1 px-3.5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg active:bg-primary-700"
                  >
                    Login
                  </Link>
                )}

                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-2 rounded-full text-gray-700 active:bg-gray-100 transition-colors"
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile row 2: full-width search */}
            <div className="px-4 pb-3">
              <SearchAutocomplete
                ref={mobileSearchRef}
                variant="mobile"
                placeholder="Search products, brands..."
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
                          ? 'bg-red-500 text-white animate-voice-pulse'
                          : 'text-gray-500 hover:bg-gray-200'
                      }`}
                      aria-label={isListening ? 'Stop listening' : 'Voice search'}
                    >
                      {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </button>
                  ) : null
                }
              />
            </div>
          </div>

          {/* Desktop row */}
          <div className="hidden md:block">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16 gap-4">
                <Link to="/" className="flex items-center gap-1 leading-none">
                  <img src="/dentzoo-logo.png" alt="Dentzoo" width="240" height="190" className="h-12 w-auto" />
                  <div className="flex flex-col leading-none gap-0">
                    <span className="text-3xl font-bold tracking-tight leading-none"><span className="text-blue-900">Dent</span><span className="text-blue-400">zoo</span></span>
                    <span className="text-gray-500 text-xs tracking-wider text-right leading-none -mt-0.5 font-semibold">.<span className="text-blue-900">co</span><span className="text-blue-400">m</span></span>
                  </div>
                </Link>

                <div className="flex items-center flex-1 max-w-lg mx-8">
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

                <div className="flex items-center space-x-4">
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
                        <LogOut className="h-5 w-5" />
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu slide-over */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="menu-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-white shadow-2xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 shrink-0">
                <span className="text-lg font-bold tracking-tight leading-none">
                  <span className="text-blue-900">Dent</span>
                  <span className="text-blue-400">zoo</span>
                  <span className="text-gray-400 text-xs tracking-wider">.com</span>
                </span>
                <button
                  onClick={closeMenu}
                  className="p-2 -mr-2 rounded-full text-gray-500 active:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <motion.div
                variants={drawerContainer}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto overscroll-contain pb-8"
              >
                <motion.div variants={drawerItem} className="px-4 pt-4">
                  {isAuthenticated ? (
                    <Link
                      to="/profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 active:bg-gray-100 transition-colors"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">
                          {user?.firstName || 'Your account'}
                        </span>
                        <span className="block text-xs text-gray-500 truncate">{user?.email}</span>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="block text-center px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl active:bg-primary-700"
                    >
                      Login
                    </Link>
                  )}
                </motion.div>

                <motion.div variants={drawerItem} className="px-4 pt-3">
                  <Link
                    to="/wishlist"
                    onClick={closeMenu}
                    className={`${drawerLinkClass} justify-between`}
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-gray-500" />
                      Wishlist
                    </span>
                    {wishlistItems.length > 0 && (
                      <span className="text-xs font-bold text-primary-600">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                </motion.div>

                <motion.div variants={drawerItem} className="px-4 pt-5">
                  <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Shop
                  </p>
                  {shopLinks.map(({ to, label, Icon }) => (
                    <Link key={to} to={to} onClick={closeMenu} className={drawerLinkClass}>
                      <Icon className="h-5 w-5 text-gray-500" />
                      {label}
                    </Link>
                  ))}
                </motion.div>

                {isAuthenticated && (
                  <motion.div variants={drawerItem} className="px-4 pt-4">
                    <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Your account
                    </p>
                    {accountLinks.map(({ to, label, Icon }) => (
                      <Link key={to} to={to} onClick={closeMenu} className={drawerLinkClass}>
                        <Icon className="h-5 w-5 text-gray-500" />
                        {label}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        closeMenu()
                        setShowLogoutModal(true)
                      }}
                      className={`${drawerLinkClass} w-full text-left text-red-600`}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </motion.div>
                )}

                <motion.div variants={drawerItem} className="px-4 pt-4">
                  <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Support
                  </p>
                  {supportLinks.map(({ to, label, Icon }) => (
                    <Link key={to} to={to} onClick={closeMenu} className={drawerLinkClass}>
                      <Icon className="h-5 w-5 text-gray-500" />
                      {label}
                    </Link>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BackButton />
      <Breadcrumbs />
      <main className="flex-1 pb-20 md:pb-0">
        <Suspense
          fallback={
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
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
              <img src="/dentzoo-logo.png" alt="Dentzoo" width="240" height="190" className="h-8 w-auto md:h-12" />
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {COMPANY.aboutBlurb}
              </p>
              <div className="flex items-center gap-3">
                {COMPANY.socials.map(({ icon: Icon, href, label }) => (
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
                  { label: 'About Us', href: '/about' },
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
                  <span className="text-gray-300 text-sm">{ADDRESS_INLINE}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <a href={`tel:${COMPANY.contact.phone}`} className="text-gray-300 hover:text-white text-sm transition-colors">
                    {COMPANY.contact.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <a href={`mailto:${COMPANY.contact.email}`} className="text-gray-300 hover:text-white text-sm transition-colors">
                      {COMPANY.contact.email}
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
                © 2026 {COMPANY.brandName}. All rights reserved.
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
