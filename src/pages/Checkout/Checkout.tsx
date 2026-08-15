import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/utils/format";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import AppImage from "@/components/common/AppImage";
import {
  Plus, Check, ShoppingCart, MapPin, Loader2,
  Trash2, Home, Phone, CreditCard, Banknote,
  X, ArrowRight, Package, Star, CheckCircle, Shield,
  Truck, ShieldCheck
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, comingSoon: true },
  { id: "cod", name: "Cash on Delivery", icon: Banknote },
];

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const { items: cartItems, setCart, clearCart } = useCartStore();
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
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

  const { data: verificationData } = useQuery({
    queryKey: ['professional-verification-status'],
    queryFn: () => api.get('/profile/verification'),
    enabled: isAuthenticated,
  });

  const addresses = addressesData?.data || [];
  const serverCartItems = cartData?.data || [];
  const displayCartItems = serverCartItems.length > 0 ? serverCartItems : cartItems;

  const subtotal = displayCartItems.reduce((sum: number, item: any) => {
    const price = item.variant?.sellingPrice || item.product.sellingPrice;
    return sum + price * item.quantity;
  }, 0);
  const total = subtotal;

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

  const [searchParams] = useSearchParams();
  const paymentCancelled = searchParams.get('payment') === 'cancelled';

  useEffect(() => {
    if (paymentCancelled) {
      toast.error('Payment was cancelled. You can try again.');
      window.history.replaceState({}, '', '/checkout');
    }
  }, [paymentCancelled]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const orderRes = await api.post("/orders", { ...data, paymentMethod: "cod" });
      return { order: orderRes.data, isCOD: true };
    },
    onSuccess: (result) => {
      toast.success("Order placed successfully!");
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders/${result.order.id}`);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShoppingCart className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Checkout</h2>
          <p className="text-sm text-gray-500 mb-8">Please login to place your order</p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40"
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const isVerified = verificationData?.data?.verified ?? user?.isProfessionalVerified;

  const isStudentOnlyCart = displayCartItems.length > 0 && displayCartItems.every(
    (item: any) => item.product.category?.slug === 'student-section'
  );

  if (isAuthenticated && !isVerified && !isStudentOnlyCart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Shield className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Verification Required</h2>
          <p className="text-sm text-gray-500 mb-2">
            Only verified dental professionals can place orders.
          </p>
          <p className="text-xs text-gray-400 mb-8">
            Verify your dental credentials to unlock checkout and start ordering products.
          </p>
          <button
            onClick={() => {
              sessionStorage.setItem('redirectAfterVerification', '/checkout');
              navigate('/profile?section=verification');
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-semibold text-sm hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40"
          >
            <ShieldCheck className="h-5 w-5" />
            Verify Now
          </button>
        </div>
      </div>
    );
  }

  if (addressesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="animate-pulse space-y-3 max-w-xl mb-8">
            <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg" />
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                <div className="h-5 bg-gradient-to-r from-primary-200 to-primary-100 rounded-lg w-1/2 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg" />
                  <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg" />
                  <div className="h-6 bg-gradient-to-r from-primary-200 to-primary-100 rounded-lg mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-0.5">Secure Checkout</p>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Checkout ({displayCartItems.length} item{displayCartItems.length !== 1 ? "s" : ""})
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Cancelled Banner */}
      {paymentCancelled && (
        <div className="container mx-auto px-4 pt-6">
          <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-red-700 font-medium">Payment was cancelled. Please try again or choose a different payment method.</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-8 space-y-4">

            {/* Saved Addresses */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-lg text-gray-900">Delivery Address</h2>
              </div>

              {addresses.length > 0 && !useNewAddress && (
                <div className="space-y-3">
                  {addresses.map((address: any) => (
                    <div
                      key={address.id}
                      className={`relative rounded-3xl p-4 md:p-5 cursor-pointer transition-all duration-300 ${
                        selectedAddressId === address.id
                          ? "border-2 border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/50 shadow-md shadow-primary-500/10"
                          : "border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 bg-white"
                      }`}
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setUseNewAddress(false);
                      }}
                    >
                      <div className="flex gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          selectedAddressId === address.id
                            ? "border-primary-500 bg-gradient-to-br from-primary-500 to-blue-500 shadow-md shadow-primary-500/20"
                            : "border-gray-300"
                        }`}>
                          {selectedAddressId === address.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{address.name}</span>
                            {address.isDefault && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-md shadow-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                            {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {address.phone}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {!address.isDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDefaultMutation.mutate(address.id);
                              }}
                              disabled={setDefaultMutation.isPending}
                              className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all"
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
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                  className={`w-full mt-3 py-3.5 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 font-medium text-sm ${
                    useNewAddress
                      ? "border-primary-500 bg-primary-50 text-primary-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              )}
            </div>

            {/* New Address Form */}
            {useNewAddress && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-bold text-lg text-gray-900">New Address</h2>
                  </div>
                  <button
                    onClick={() => {
                      setUseNewAddress(false);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="10-digit number"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">House No. / Street *</label>
                    <input
                      type="text"
                      required
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                      placeholder="e.g., 123 Main Road"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Area / Locality</label>
                      <input
                        type="text"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="e.g., Sector 15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Landmark</label>
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="e.g., Near Metro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white"
                        placeholder="6-digit"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 text-sm font-medium"
                    >
                      {gettingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      {gettingLocation ? "Getting location..." : "Use Current Location"}
                    </button>

                    <label className="flex items-center gap-2.5 cursor-pointer group ml-auto">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        saveAddress
                          ? "bg-gradient-to-br from-primary-500 to-blue-500 border-primary-500 shadow-md shadow-primary-500/20"
                          : "border-gray-300 group-hover:border-gray-400"
                      }`}>
                        {saveAddress && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Save this address for future orders</span>
                    </label>
                  </div>
                </form>
              </div>
            )}

            {/* No addresses state */}
            {addresses.length === 0 && !useNewAddress && (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Home className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">No saved addresses</h3>
                <p className="text-sm text-gray-500 mb-6">Add an address to continue checkout</p>
                <button
                  onClick={() => setUseNewAddress(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>
            )}

            {/* Payment Method */}
            {(selectedAddressId || useNewAddress) && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-bold text-lg text-gray-900">Payment Method</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => !method.comingSoon && setPaymentMethod(method.id)}
                        disabled={method.comingSoon}
                        className={`flex items-center gap-3 p-4 md:p-5 border rounded-2xl transition-all duration-300 ${
                          method.comingSoon
                            ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                            : isSelected
                              ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/50 shadow-md shadow-primary-500/10"
                              : "border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-200/50 bg-white"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          method.comingSoon
                            ? "bg-gray-200"
                            : isSelected
                              ? "bg-gradient-to-br from-primary-500 to-blue-500 shadow-md shadow-primary-500/20"
                              : "bg-gray-100"
                        }`}>
                          <Icon className={`w-5 h-5 ${method.comingSoon ? "text-gray-400" : isSelected ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold text-sm ${method.comingSoon ? "text-gray-400" : isSelected ? "text-primary-700" : "text-gray-900"}`}>{method.name}</span>
                          {method.comingSoon && (
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Coming Soon</p>
                          )}
                          {method.id === "cod" && !method.comingSoon && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">No extra charges</p>
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
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden sticky top-20 shadow-sm">
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 px-6 py-5">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </h3>
              </div>

              {displayCartItems.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <ShoppingCart className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-4 text-sm">Cart is empty</p>
                  <button
                    onClick={() => navigate("/products")}
                    className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-5 scrollbar-hide">
                    {displayCartItems.map((item: any) => {
                      const price = item.variant?.sellingPrice || item.product.sellingPrice;
                      const image = item.variant?.image || item.product.images?.[0];
                      return (
                        <div key={item.id} className="flex gap-3">
                          {image && (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                              <AppImage src={image} alt={item.product.name} className="w-full h-full object-cover" widths={[128, 256]} sizes="64px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                            {item.variant && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full mt-0.5">
                                {item.variant.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-sm font-bold">₹{formatPrice(price)}</span>
                              <span className="text-xs text-gray-400">x{item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold text-gray-900">₹{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery</span>
                      <span className="font-semibold text-emerald-600">Free</span>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">₹{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={createOrderMutation.isPending || (!selectedAddressId && !useNewAddress)}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl font-bold text-sm hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Trust Badges */}
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2.5 p-3 bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl border border-blue-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-700">Free Delivery</p>
                          <p className="text-[9px] text-gray-500">On all orders</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/20">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-700">Secure Payment</p>
                          <p className="text-[9px] text-gray-500">100% protected</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-700">Quality Assured</p>
                          <p className="text-[9px] text-gray-500">Genuine products</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-700">Easy Returns</p>
                          <p className="text-[9px] text-gray-500">7-day returns</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {(selectedAddressId || useNewAddress) && displayCartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total</p>
              <p className="text-lg font-bold text-gray-900">₹{formatPrice(total)}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending}
              className="flex-1 max-w-[220px] py-3.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 disabled:opacity-50"
            >
              {createOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {paymentMethod === "cod" ? "Place Order" : "Pay Now"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => {
          if (showDeleteModal) {
            deleteAddressMutation.mutate(showDeleteModal);
          }
        }}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
      />
    </div>
  );
}
