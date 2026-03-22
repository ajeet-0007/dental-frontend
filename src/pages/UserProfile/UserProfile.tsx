import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api'
import { User, MapPin, Plus, Trash2, Edit, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function UserProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses'>('personal')
  const addressesRef = useRef<HTMLDivElement>(null)
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

  const addresses = addressesData?.data || []

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

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm })
    } else {
      addAddressMutation.mutate(addressForm)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Please login to view profile</h2>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left rounded ${
                  activeTab === 'personal' ? 'bg-gray-50 text-primary-600' : 'hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5" />
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left rounded ${
                  activeTab === 'addresses' ? 'bg-gray-50 text-primary-600' : 'hover:bg-gray-50'
                }`}
              >
                <MapPin className="h-5 w-5" />
                My Addresses
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="w-full flex items-center gap-2 px-4 py-2 text-left rounded hover:bg-gray-50"
              >
                <ShoppingBag className="h-5 w-5" />
                My Orders
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {activeTab === 'personal' && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium">{user?.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium">{user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{user?.phone}</p>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'addresses' && (
            <div ref={addressesRef} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Saved Addresses</h2>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleSubmitAddress} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-4">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Address Line 1</label>
                      <input
                        type="text"
                        required
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                      <input
                        type="text"
                        required
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="isDefault" className="text-sm text-gray-600">Set as default address</label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {editingAddress ? 'Update' : 'Save'} Address
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {addressesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved addresses</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address: any) => (
                    <div key={address.id} className="border p-4 rounded-lg relative">
                      {address.isDefault && (
                        <span className="absolute top-2 right-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                      <p className="font-medium">{address.name}</p>
                      <p className="text-sm text-gray-600">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this address?')) {
                              deleteAddressMutation.mutate(address.id)
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
