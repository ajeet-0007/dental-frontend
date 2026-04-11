import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api'
import { User, MapPin, Plus, Edit, ShoppingBag, Heart, ChevronRight, HelpCircle, Loader2, Package, Clock, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal'
import LogoutModal from '@/components/common/LogoutModal'

export default function UserProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, logout, setUser } = useAuthStore()
  const { items: wishlistItems } = useWishlistStore()

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
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const addressesRef = useRef<HTMLDivElement>(null)
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
    queryFn: () => api.get('/orders?limit=5'),
    enabled: isAuthenticated,
  })

  const addresses = addressesData?.data || []
  const orders = ordersData?.data?.orders || ordersData?.data || []
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
      setActiveSection('addresses')
    } else if (section === 'overview') {
      setActiveSection('overview')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Dentalkart</h2>
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
        return { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
      case 'shipped':
        return { bg: 'bg-blue-100 text-blue-700', icon: Package }
      case 'processing':
      case 'confirmed':
        return { bg: 'bg-amber-100 text-amber-700', icon: Clock }
      case 'cancelled':
        return { bg: 'bg-red-100 text-red-700', icon: Clock }
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: Clock }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })
  }

  const menuItems = [
    { id: 'overview', icon: User, label: 'My Profile' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders', badge: orders.length },
    { id: 'addresses', icon: MapPin, label: 'My Addresses', badge: addresses.length },
    { id: 'wishlist', icon: Heart, label: 'My Wishlist', badge: wishlistItems.length },
    { id: 'help', icon: HelpCircle, label: 'Help & Support' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-sm font-bold text-white">{getInitials()}</span>
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
            className="relative p-2 bg-gray-100 rounded-xl"
          >
            <ShoppingBag className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-4"
            >
              {/* User Avatar */}
              <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">{getInitials()}</span>
                </div>
                <h3 className="font-semibold text-white">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-white/70 text-sm">{user?.email}</p>
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
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 shadow-sm'
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
              className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 md:p-8 text-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1">
                    Welcome back, {user?.firstName}!
                  </h2>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: 'Orders', value: orders.length, icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
                { label: 'Wishlist', value: wishlistItems.length, icon: Heart, color: 'from-pink-500 to-pink-600' },
                { label: 'Addresses', value: addresses.length, icon: MapPin, color: 'from-emerald-500 to-emerald-600' },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() => stat.label === 'Orders' ? navigate('/orders') : stat.label === 'Wishlist' ? navigate('/wishlist') : setActiveSection('addresses')}
                  className="bg-white rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </button>
              ))}
            </motion.div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => navigate('/orders')}
                    className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {recentOrders.map((order: any) => {
                    const statusConfig = getOrderStatusConfig(order.status)
                    const StatusIcon = statusConfig.icon

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{order.items?.length || 0} items • ₹{Number(order.totalAmount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg}`}>
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
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
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
                        <label className="block text-sm text-gray-500 mb-1">First Name</label>
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">First Name</p>
                      <p className="font-semibold text-gray-900">{user?.firstName || '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Last Name</p>
                      <p className="font-semibold text-gray-900">{user?.lastName || '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{user?.email || '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-semibold text-gray-900">
                        {user?.phone && !user.phone.startsWith('social_') ? `+91 ${user.phone}` : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                ref={addressesRef}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSubmitAddress} className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Phone</label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm text-gray-600">Address Line 1</label>
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <button
                        type="submit"
                        disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                        className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {editingAddress ? 'Update' : 'Save'} Address
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
                        <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                      ))}
                    </div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">No saved addresses yet</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-primary-600 font-medium hover:text-primary-700"
                    >
                      Add your first address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {addresses.map((address: any) => (
                      <div
                        key={address.id}
                        className="border border-gray-200 p-4 rounded-xl hover:border-primary-300 hover:shadow-md transition-all relative"
                      >
                        {address.isDefault && (
                          <span className="absolute top-3 right-3 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{address.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
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
                                <Edit className="h-4 w-4" />
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
