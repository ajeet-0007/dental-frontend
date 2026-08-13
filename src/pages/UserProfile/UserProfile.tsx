import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api'
import { formatPrice } from '@/utils/format'
import { User, MapPin, Plus, Edit, ShoppingBag, Heart, ChevronRight, HelpCircle, Loader2, Package, Clock, CheckCircle, Shield, LogOut, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal'
import LogoutModal from '@/components/common/LogoutModal'
import ProfessionalVerification from './ProfessionalVerification'
import AppImage from '@/components/common/AppImage'

export default function UserProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, logout, setUser } = useAuthStore()
  const { items: wishlistItems } = useWishlistStore()
  const [searchParams] = useSearchParams()

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    const section = searchParams.get('section')
    if (section === 'verification') {
      setActiveSection('verification')
      const url = new URL(window.location.href)
      url.searchParams.delete('section')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [searchParams])
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const overviewRef = useRef<HTMLDivElement>(null)
  const verificationRef = useRef<HTMLDivElement>(null)
  const addressesRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
  const { getLocationWithAddress, loading: locationLoading } = useGeolocation()

  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  })

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses'),
    enabled: isAuthenticated,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled: isAuthenticated,
  })

  const addresses = addressesData?.data || []
  const orders = ordersData?.data?.orders || ordersData?.data || []
  const totalOrders = ordersData?.data?.total ?? orders.length
  const recentOrders = orders.slice(0, 3)

  const addAddressMutation = useMutation({
    mutationFn: (data: any) => api.post('/addresses', data),
    onSuccess: () => {
      toast.success('Address added successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      resetForm()
    },
    onError: () => {
      toast.error('Failed to add address')
    },
  })

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/addresses/${id}`, data),
    onSuccess: () => {
      toast.success('Address updated successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      resetForm()
    },
    onError: () => {
      toast.error('Failed to update address')
    },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`),
    onSuccess: () => {
      toast.success('Address deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: () => {
      toast.error('Failed to delete address')
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; phone: string }) =>
      api.put('/users/profile', data),
    onSuccess: (res) => {
      toast.success('Profile updated successfully')
      setUser({
        ...user!,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        phone: res.data.phone,
      })
      setIsEditingProfile(false)
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const startEditProfile = () => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone?.startsWith('social_') ? '' : user?.phone || '',
    })
    setIsEditingProfile(true)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileForm)
  }

  const resetForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
    setAddressForm({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    })
  }

  const handleEditAddress = (address: any) => {
    setEditingAddress(address)
    setAddressForm({
      name: address.name || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      isDefault: address.isDefault || false,
    })
    setShowAddressForm(true)
  }

  const handleUseMyLocation = async () => {
    try {
      const addressData = await getLocationWithAddress()
      setAddressForm(prev => ({
        ...prev,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
      }))
      toast.success('Location detected! Address filled.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to get location')
    }
  }

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm })
    } else {
      addAddressMutation.mutate(addressForm)
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === 'orders') {
      navigate('/orders')
    } else if (section === 'wishlist') {
      navigate('/wishlist')
    } else if (section === 'addresses') {
      scrollToSection(addressesRef)
    } else if (section === 'overview') {
      scrollToSection(overviewRef)
    } else if (section === 'verification') {
      scrollToSection(verificationRef)
    } else if (section === 'help') {
      navigate('/help')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30"
          >
            <User className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Dentzoo</h2>
          <p className="text-gray-500 mb-6">Login to view your profile, track orders, and manage your account</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/30"
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    )
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  const getOrderStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle, iconBg: 'bg-emerald-100' }
      case 'shipped':
        return { bg: 'bg-blue-50 text-blue-700 border border-blue-200', icon: Package, iconBg: 'bg-blue-100' }
      case 'processing':
      case 'confirmed':
        return { bg: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock, iconBg: 'bg-amber-100' }
      case 'cancelled':
        return { bg: 'bg-red-50 text-red-700 border border-red-200', icon: Clock, iconBg: 'bg-red-100' }
      default:
        return { bg: 'bg-gray-50 text-gray-700 border border-gray-200', icon: Clock, iconBg: 'bg-gray-100' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })
  }

  const menuItems = [
    { id: 'overview', icon: User, label: 'My Profile', gradient: 'from-violet-500 to-purple-500' },
    { id: 'verification', icon: Shield, label: 'Verification', gradient: 'from-emerald-500 to-green-500' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders', badge: totalOrders, gradient: 'from-blue-500 to-indigo-500' },
    { id: 'addresses', icon: MapPin, label: 'Addresses', badge: addresses.length, gradient: 'from-orange-500 to-amber-500' },
    { id: 'wishlist', icon: Heart, label: 'Wishlist', badge: wishlistItems.length, gradient: 'from-pink-500 to-rose-500' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', gradient: 'from-teal-500 to-cyan-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 overflow-hidden">
              {user?.avatar && !avatarFailed ? (
                <AppImage
                  src={user.avatar}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  onError={() => setAvatarFailed(true)}
                  className="w-full h-full rounded-xl object-cover"
                  responsive={false}
                />
              ) : (
                <span className="text-sm font-bold text-white">{getInitials()}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-0.5">Account</p>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">My Account</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4"
            >
              {/* User Avatar */}
              <div className="p-6 bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30 overflow-hidden">
                    {user?.avatar && !avatarFailed ? (
                      <AppImage
                        src={user.avatar}
                        alt={`${user?.firstName} ${user?.lastName}`}
                        onError={() => setAvatarFailed(true)}
                        className="w-full h-full rounded-full object-cover"
                        responsive={false}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">{getInitials()}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white text-lg">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isActive 
                            ? `bg-gradient-to-br ${item.gradient} shadow-md` 
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-red-100">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-white text-gray-600 shadow-sm border border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Hero Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-r from-primary-600 via-primary-700 to-blue-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1">
                    Welcome back, {user?.firstName}! 👋
                  </h2>
                  <p className="text-white/70 text-sm">Manage your account and track your orders</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3 md:gap-4"
            >
              {[
                { label: 'Orders', value: totalOrders, icon: ShoppingBag, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
                { label: 'Wishlist', value: wishlistItems.length, icon: Heart, gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
                { label: 'Addresses', value: addresses.length, icon: MapPin, gradient: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() => stat.label === 'Orders' ? navigate('/orders') : stat.label === 'Wishlist' ? navigate('/wishlist') : setActiveSection('addresses')}
                  className="bg-white rounded-2xl p-4 text-left shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 shadow-md ${stat.shadow} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                </button>
              ))}
            </motion.div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  </div>
                  <button
                    onClick={() => navigate('/orders')}
                    className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1 group"
                  >
                    View All 
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="space-y-3">
                  {recentOrders.map((order: any) => {
                    const statusConfig = getOrderStatusConfig(order.status)
                    const StatusIcon = statusConfig.icon

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${statusConfig.iconBg}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{order.items?.length || 0} items • ₹{formatPrice(order.totalAmount)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Personal Info Section */}
            {activeSection === 'overview' && (
              <motion.div
                ref={overviewRef}
                id="overview"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/20">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={startEditProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors font-medium text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'First Name', value: user?.firstName || '-' },
                      { label: 'Last Name', value: user?.lastName || '-' },
                      { label: 'Email', value: user?.email || '-' },
                      { label: 'Phone', value: user?.phone && !user.phone.startsWith('social_') ? `+91 ${user.phone}` : 'Not set' },
                    ].map((field) => (
                      <div key={field.label} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{field.label}</p>
                        <p className="font-semibold text-gray-900">{field.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Professional Verification Section */}
            {activeSection === 'verification' && (
              <div ref={verificationRef} id="verification">
                <ProfessionalVerification />
              </div>
            )}

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
              <motion.div
                id="addresses"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                ref={addressesRef}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-medium text-sm shadow-lg shadow-primary-500/25"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSubmitAddress} className="mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Name</label>
                        <input
                          type="text"
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Phone</label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Address Line 1</label>
                          <button
                            type="button"
                            onClick={handleUseMyLocation}
                            disabled={locationLoading}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                          >
                            {locationLoading ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Detecting...
                              </>
                            ) : (
                              <>
                                <MapPin className="h-3 w-3" />
                                Use My Location
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={addressForm.addressLine1}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Address Line 2</label>
                        <input
                          type="text"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">City</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">State</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Pincode</label>
                        <input
                          type="text"
                          required
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-600">
                          Set as default address
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-5">
                      <button
                        type="submit"
                        disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                        className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                      >
                        {(addAddressMutation.isPending || updateAddressMutation.isPending) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          editingAddress ? 'Update Address' : 'Save Address'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addressesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
                      ))}
                    </div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">No saved addresses yet</p>
                    <p className="text-gray-500 text-sm mb-4">Add your first address for faster checkout</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {addresses.map((address: any) => (
                      <div
                        key={address.id}
                        className="border border-gray-200 p-4 rounded-2xl hover:border-primary-300 hover:shadow-md transition-all duration-300 relative group"
                      >
                        {address.isDefault && (
                          <span className="absolute top-3 right-3 text-xs bg-gradient-to-r from-primary-500 to-primary-600 text-white px-2.5 py-1 rounded-full font-semibold shadow-md shadow-primary-500/20">
                            Default
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
                            <MapPin className="h-4 w-4 text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{address.name}</p>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Phone: +91 {address.phone}</p>
                            <div className="flex gap-4 mt-3">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteAddressId(address.id)}
                                className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={!!deleteAddressId}
            onClose={() => setDeleteAddressId(null)}
            onConfirm={() => deleteAddressId && deleteAddressMutation.mutate(deleteAddressId)}
          />

          {/* Logout Confirmation Modal */}
          <LogoutModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={logout}
          />
        </div>
      </div>
    </div>
  )
}
