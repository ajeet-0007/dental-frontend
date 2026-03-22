import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { Plus, Check, ShoppingCart } from 'lucide-react'

export default function Checkout() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { items: cartItems } = useCartStore()
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  })

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses'),
    enabled: isAuthenticated,
  })

  const addresses = addressesData?.data || []

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant ? item.variant.price : (item.product.sellingPrice || item.product.price)
    return sum + (price * item.quantity)
  }, 0)
  const shipping = subtotal > 500 ? 0 : 50
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + shipping + tax

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const orderRes = await api.post('/orders', data)
      const orderId = orderRes.data.id
      
      const paymentRes = await api.post('/payments/create-checkout-session', {
        orderId,
      })
      
      if (paymentRes.data.url) {
        window.location.href = paymentRes.data.url
      }
      
      return orderRes.data
    },
    onSuccess: () => {
      toast.success('Redirecting to payment...')
    },
    onError: () => {
      toast.error('Failed to create order')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to place order')
      navigate('/login')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      navigate('/products')
      return
    }

    if (!useNewAddress && !selectedAddressId) {
      toast.error('Please select an address')
      return
    }

    if (useNewAddress) {
      if (!formData.name || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode || !formData.phone) {
        toast.error('Please fill all required fields')
        return
      }
      createOrderMutation.mutate({
        shippingAddress: `${formData.name}, ${formData.addressLine1}, ${formData.addressLine2}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        phone: formData.phone,
      })
    } else {
      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId)
      if (selectedAddress) {
        createOrderMutation.mutate({
          addressId: selectedAddressId,
          shippingAddress: `${selectedAddress.name}, ${selectedAddress.addressLine1}, ${selectedAddress.addressLine2 || ''}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
          phone: selectedAddress.phone,
        })
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Please login to checkout</h2>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Login
        </button>
      </div>
    )
  }

  if (addressesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 h-fit animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                  <div className="h-8 bg-gray-200 rounded mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Select Delivery Address</h2>
            
            {addressesLoading ? (
              <p className="text-gray-500">Loading addresses...</p>
            ) : addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address: any) => (
                  <div
                    key={address.id}
                    onClick={() => {
                      setSelectedAddressId(address.id)
                      setUseNewAddress(false)
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedAddressId === address.id && !useNewAddress
                        ? 'border-primary-600 bg-primary-50'
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        selectedAddressId === address.id && !useNewAddress
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAddressId === address.id && !useNewAddress && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{address.name} {address.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded ml-2">Default</span>}</p>
                        <p className="text-sm text-gray-600">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div
                  onClick={() => setUseNewAddress(true)}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    useNewAddress
                      ? 'border-primary-600 bg-primary-50'
                      : 'hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      useNewAddress
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300'
                    }`}>
                      {useNewAddress && (
                        <Plus className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Plus className="w-4 h-4" />
                      Add New Address
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No saved addresses found.</p>
                <button
                  onClick={() => setUseNewAddress(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              </div>
            )}
          </div>

          {useNewAddress && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">New Address</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine1: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine2: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending || cartItems.length === 0}
                  className="w-full mt-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createOrderMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </form>
            </div>
          )}

          {!useNewAddress && selectedAddressId && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending || cartItems.length === 0}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {createOrderMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
            </button>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Order Summary ({cartItems.length} items)</h3>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">Your cart is empty</p>
                <button
                  onClick={() => navigate('/products')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cartItems.map((item) => {
                    const price = item.variant ? item.variant.price : (item.product.sellingPrice || item.product.price)
                    const image = item.variant?.image || item.product.images?.[0] || ''
                    return (
                      <div key={item.id} className="flex gap-3">
                        {image && (
                          <img
                            src={image}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded border"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-xs text-gray-500">{item.variant.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium">₹{price.toFixed(2)}</span>
                            <span className="text-xs text-gray-500">x {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  {subtotal <= 500 && (
                    <p className="text-xs text-green-600">Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
