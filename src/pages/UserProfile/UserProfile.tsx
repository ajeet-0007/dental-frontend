import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api'
import { User, MapPin, Plus, Edit, ShoppingBag, Heart, ChevronDown, HelpCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
  ProfileHeader,
  ProfileBottomSheet,
  QuickStats,
  ActionCards,
} from '@/components/profile'
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal'

export default function UserProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, logout, setUser } = useAuthStore()
  const { items: wishlistItems } = useWishlistStore()

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses'>('personal')
  const [activeSection, setActiveSection] = useState('overview')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
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
    queryFn: () => api.get('/orders?limit=100'),
    enabled: isAuthenticated,
  })

  const addresses = addressesData?.data || []
  const orders = ordersData?.data?.orders || ordersData?.data || []

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
      setActiveTab('addresses')
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
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Dentalkart</h2>
          <p className="text-gray-500 mb-6">Login to view your profile, track orders, and manage your account</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full md:w-auto px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Profile Tap */}
      <div className="bg-white border-b md:hidden">
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-600">
                {getInitials()}
              </span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">Tap for menu</p>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4">
              <div className="p-4 border-b border-gray-100">
                <ProfileHeader />
              </div>

              <nav className="p-2">
                {[
                  { id: 'overview', icon: User, label: 'My Profile' },
                  { id: 'orders', icon: ShoppingBag, label: 'My Orders' },
                  { id: 'addresses', icon: MapPin, label: 'My Addresses' },
                  { id: 'wishlist', icon: Heart, label: 'My Wishlist' },
                  { id: 'help', icon: HelpCircle, label: 'Help & Support' },
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-gray-700' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </nav>

              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Sheet */}
          <ProfileBottomSheet
            isOpen={isBottomSheetOpen}
            onClose={() => setIsBottomSheetOpen(false)}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Quick Stats */}
            <div className="mb-6">
              <QuickStats
                orderCount={orders.length}
                wishlistCount={wishlistItems.length}
                addressCount={addresses.length}
                onOrdersClick={() => navigate('/orders')}
                onWishlistClick={() => navigate('/wishlist')}
                onAddressesClick={() => {
                  setActiveSection('addresses')
                  setActiveTab('addresses')
                }}
              />
            </div>

            {/* Action Cards */}
            <div className="mb-6">
              <ActionCards
                orderCount={orders.length}
                wishlistCount={wishlistItems.length}
                addressCount={addresses.length}
                onOrdersClick={() => navigate('/orders')}
                onWishlistClick={() => navigate('/wishlist')}
                onAddressesClick={() => {
                  setActiveSection('addresses')
                  setActiveTab('addresses')
                }}
                onHelpClick={() => navigate('/help')}
              />
            </div>

            {/* Personal Info Section */}
            {activeSection === 'overview' && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  {!isEditingProfile && (
                    <button
                      onClick={startEditProfile}
                      className="text-sm text-primary-600 font-medium hover:text-primary-700"
                    >
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">First Name</p>
                      <p className="font-medium text-gray-900">{user?.firstName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Name</p>
                      <p className="font-medium text-gray-900">{user?.lastName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{user?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">
                        {user?.phone && !user.phone.startsWith('social_') ? `+91 ${user.phone}` : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Section */}
            {(activeSection === 'addresses' || activeTab === 'addresses') && (
              <div ref={addressesRef} className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSubmitAddress} className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Phone</label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {editingAddress ? 'Update' : 'Save'} Address
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
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
                        className="border border-gray-200 p-4 rounded-xl hover:border-gray-300 transition-colors relative"
                      >
                        {address.isDefault && (
                          <span className="absolute top-3 right-3 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
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
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={!!deleteAddressId}
            onClose={() => setDeleteAddressId(null)}
            onConfirm={() => deleteAddressId && deleteAddressMutation.mutate(deleteAddressId)}
          />
        </div>
      </div>
    </div>
  )
}
