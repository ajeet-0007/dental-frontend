import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { 
  Plus, Check, ShoppingCart, MapPin, Loader2, 
  Trash2, Home, Phone, CreditCard, Banknote,
  X, ArrowRight, Package, Star, CheckCircle
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard },
  { id: "cod", name: "Cash on Delivery", icon: Banknote },
];

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { items: cartItems, setCart } = useCartStore();
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lon: longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();

          if (data.address) {
            const address = data.address;
            const houseNumber = address.house_number ? address.house_number + " " : "";
            const road = address.road || "";
            const neighborhood = address.neighbourhood || address.suburb || "";
            const locality = address.locality || address.industrial || "";
            
            setFormData((prev: any) => ({
              ...prev,
              addressLine1: `${houseNumber}${road}`.trim() || neighborhood || locality || "",
              addressLine2: neighborhood && road ? neighborhood : "",
              landmark: address.landmark || address.amenity || "",
              city: address.state_district || address.city || address.town || address.village || "",
              state: address.state || "",
              pincode: address.postcode || "",
              country: address.country || "India",
            }));
            toast.success("Location detected! Address filled.");
          } else {
            toast.error("Could not find address for this location");
          }
        } catch {
          toast.error("Failed to get address from location");
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out");
            break;
          default:
            toast.error("An error occurred while getting location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && cartData?.data) {
      setCart(cartData.data, cartData.data.length);
    }
  }, [cartData, isAuthenticated, setCart]);

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses"),
    enabled: isAuthenticated,
  });

  const addresses = addressesData?.data || [];
  const serverCartItems = cartData?.data || [];
  const displayCartItems = cartItems.length > 0 ? cartItems : serverCartItems;

  const subtotal = displayCartItems.reduce((sum: number, item: any) => {
    const price = item.variant ? item.variant.price : item.product.sellingPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const createAddressMutation = useMutation({
    mutationFn: (data: any) => api.post("/addresses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address saved successfully");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address deleted");
      setShowDeleteModal(null);
      if (selectedAddressId === showDeleteModal) {
        setSelectedAddressId(null);
      }
    },
    onError: () => toast.error("Failed to delete address"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => api.put(`/addresses/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Default address updated");
    },
    onError: () => toast.error("Failed to update default address"),
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.paymentMethod === "cod") {
        const orderRes = await api.post("/orders", data);
        return { order: orderRes.data, isCOD: true };
      }

      const orderRes = await api.post("/orders", data);
      const orderId = orderRes.data.id;

      const paymentRes = await api.post("/payments/create-checkout-session", { orderId });

      if (paymentRes.data.url) {
        window.location.href = paymentRes.data.url;
      }

      return { order: orderRes.data, isCOD: false };
    },
    onSuccess: (result) => {
      if (result.isCOD) {
        toast.success("Order placed successfully!");
        navigate(`/orders/${result.order.id}`);
      } else {
        toast.success("Redirecting to payment...");
      }
    },
    onError: () => toast.error("Failed to create order"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to checkout");
      navigate("/login");
      return;
    }

    if (displayCartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/products");
      return;
    }

    if (!useNewAddress && !selectedAddressId) {
      toast.error("Please select an address");
      return;
    }

    if (useNewAddress) {
      if (!formData.name || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode || !formData.phone) {
        toast.error("Please fill all required fields");
        return;
      }

      const orderData = {
        shippingAddress: `${formData.name}, ${formData.addressLine1}, ${formData.addressLine2}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        phone: formData.phone,
        paymentMethod,
      };

      if (saveAddress) {
        createAddressMutation.mutate({
          name: formData.name,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lon,
          isDefault: false,
        });
      }

      createOrderMutation.mutate(orderData);
    } else {
      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);
      if (selectedAddress) {
        createOrderMutation.mutate({
          addressId: selectedAddressId,
          shippingAddress: `${selectedAddress.name}, ${selectedAddress.addressLine1}, ${selectedAddress.addressLine2 || ""}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
          phone: selectedAddress.phone,
          paymentMethod,
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    });
    setSaveAddress(false);
    setCurrentLocation(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Login to checkout</h2>
          <p className="text-gray-500 mb-4">Please login to place your order</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (addressesLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="h-80 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500">{displayCartItems.length} item{displayCartItems.length !== 1 ? "s" : ""} in cart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Address & Payment */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Saved Addresses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-400" />
              Delivery Address
            </h2>
            
            {addresses.length > 0 && !useNewAddress && (
              <div className="space-y-3">
                {addresses.map((address: any) => (
                  <div
                    key={address.id}
                    className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedAddressId === address.id
                        ? "border-primary-500 bg-primary-50/50"
                        : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setSelectedAddressId(address.id);
                      setUseNewAddress(false);
                    }}
                  >
                    <div className="flex gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        selectedAddressId === address.id
                          ? "border-primary-500 bg-primary-500"
                          : "border-gray-300"
                      }`}>
                        {selectedAddressId === address.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{address.name}</span>
                          {address.isDefault && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {address.phone}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {!address.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultMutation.mutate(address.id);
                            }}
                            disabled={setDefaultMutation.isPending}
                            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(address.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addresses.length > 0 && (
              <button
                onClick={() => {
                  setUseNewAddress(true);
                  setSelectedAddressId(null);
                  resetForm();
                }}
                className={`w-full mt-3 py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all ${
                  useNewAddress
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Plus className="w-4 h-4" />
                Add New Address
              </button>
            )}
          </div>

          {/* New Address Form */}
          {useNewAddress && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-gray-900">New Address</h2>
                <button
                  onClick={() => {
                    setUseNewAddress(false);
                    resetForm();
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House No. / Street *</label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., 123 Main Road"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality</label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Sector 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Near Metro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="6-digit"
                      maxLength={6}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {gettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {gettingLocation ? "Getting location..." : "Use Current Location"}
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Save this address for future orders</span>
                </label>
              </form>
            </div>
          )}

          {/* No addresses state */}
          {addresses.length === 0 && !useNewAddress && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No saved addresses</h3>
              <p className="text-sm text-gray-500 mb-4">Add an address to continue checkout</p>
              <button
                onClick={() => setUseNewAddress(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
              >
                Add Address
              </button>
            </div>
          )}

          {/* Payment Method */}
          {(selectedAddressId || useNewAddress) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${
                        paymentMethod === method.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${paymentMethod === method.id ? "text-primary-600" : "text-gray-400"}`} />
                      <div className="text-left">
                        <span className="font-medium text-sm">{method.name}</span>
                        {method.id === "cod" && (
                          <p className="text-xs text-green-600">No extra charges</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
            <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              Order Summary
            </h2>

            {displayCartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">Cart is empty</p>
                <button
                  onClick={() => navigate("/products")}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {displayCartItems.map((item: any) => {
                    const price = item.variant ? item.variant.price : item.product.sellingPrice || item.product.price;
                    const image = item.variant?.image || item.product.images?.[0];
                    return (
                      <div key={item.id} className="flex gap-3">
                        {image && (
                          <img src={image} alt={item.product.name} className="w-14 h-14 object-cover rounded-lg" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium">₹{price.toLocaleString()}</span>
                            <span className="text-xs text-gray-500">x {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span className="font-medium">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={createOrderMutation.isPending || (!selectedAddressId && !useNewAddress)}
                  className="w-full mt-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createOrderMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {paymentMethod === "cod" ? "Place Order" : "Proceed to Payment"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Delete Address</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this address?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAddressMutation.mutate(showDeleteModal)}
                disabled={deleteAddressMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 font-medium"
              >
                {deleteAddressMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
