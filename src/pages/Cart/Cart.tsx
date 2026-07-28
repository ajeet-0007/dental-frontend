import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Tag, ShoppingBag, Shield, Check, Truck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useState } from "react";
import ProductCarousel from "@/components/common/ProductCarousel";
import CartDrawer from "@/components/common/CartDrawer";


const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const { items, removeItem, updateQuantity, setCart } = useCartStore();
  const [cartDrawerProduct, setCartDrawerProduct] = useState<any>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { data: verificationData } = useQuery({
    queryKey: ['professional-verification-status'],
    queryFn: () => api.get('/profile/verification'),
    enabled: isAuthenticated,
  });

  const isVerified = verificationData?.data?.verified ?? user?.isProfessionalVerified;

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cart/${id}`),
    onSuccess: (_, deletedId) => {
      removeItem(deletedId);
      queryClient.setQueryData(["cart"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((item: any) => item.id !== deletedId),
        };
      });
    },
    onError: async () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      try {
        const res = await api.get("/cart");
        const data = Array.isArray(res.data) ? res.data : [];
        setCart(data, data.length);
      } catch {}
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.put(`/cart/${id}`, { quantity }),
    onSuccess: (_, { id, quantity }) => {
      queryClient.setQueryData(["cart"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((item: any) =>
            item.id === id ? { ...item, quantity } : item
          ),
        };
      });
    },
    onError: async () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      try {
        const res = await api.get("/cart");
        const data = Array.isArray(res.data) ? res.data : [];
        setCart(data, data.length);
      } catch {}
    },
  });

  const serverItems = data?.data || [];
  const allItems = items.length > 0 ? items : serverItems;

  const isStudentOnlyCart = allItems.length > 0 && allItems.every(
    (item: any) => item.product.category?.slug === 'student-section'
  );
  const canCheckoutWithoutVerification = isVerified || isStudentOnlyCart;

  const subtotal = allItems.reduce(
    (sum: number, item: any) =>
      sum + (item.variant?.sellingPrice || item.product.sellingPrice) * item.quantity,
    0,
  );

  const totalMrp = allItems.reduce(
    (sum: number, item: any) =>
      sum + (item.product.mrp || item.variant?.mrp || item.variant?.sellingPrice || item.product.sellingPrice) * item.quantity,
    0,
  );

  const totalSavings = totalMrp - subtotal;

  const total = subtotal;

  const cartCategories = [...new Set(
    allItems
      .map((item: any) => item.product.category?.slug)
      .filter(Boolean)
  )] as string[];

  const excludeProductIds = allItems.map((item: any) => item.product.id);

  const { data: recommendedData } = useQuery({
    queryKey: ["products", "recommended", cartCategories, excludeProductIds],
    queryFn: async () => {
      if (cartCategories.length === 0) return [];
      const categories = cartCategories.join(',');
      const exclude = excludeProductIds.join(',');
      const response = await api.get(`/products/recommended?categories=${categories}&exclude=${exclude}&limit=8`);
      return response.data || [];
    },
    enabled: cartCategories.length > 0 && allItems.length > 0,
  });

  const recommendedProductsArray = Array.isArray(recommendedData) ? recommendedData : [];

  const handleRemove = async (id: string) => {
    removeItem(id);
    if (isAuthenticated) {
      await removeMutation.mutateAsync(id);
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
    if (isAuthenticated) {
      updateMutation.mutate({ id, quantity });
    }
  };

  if (allItems.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingCart className="h-12 w-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Looks like you haven't added anything yet. Start exploring our products!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 hover:scale-105"
            >
              <ShoppingBag className="h-5 w-5" />
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-3 max-w-xl mb-8">
            <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg" />
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-100 rounded-2xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/4" />
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-1/2" />
                      <div className="h-5 bg-gradient-to-r from-primary-200 to-primary-100 rounded-lg w-1/3" />
                    </div>
                  </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-0.5">Your Cart</p>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Shopping Cart ({allItems.length})</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-3">
            {allItems.map((item: any) => {
              const unitPrice = item.variant?.sellingPrice || item.product.sellingPrice;
              const unitMrp = item.product.mrp || item.variant?.mrp || unitPrice;
              const itemTotal = unitPrice * item.quantity;
              const itemDiscount = unitMrp > unitPrice ? Math.round((1 - unitPrice / unitMrp) * 100) : 0;

              return (
                <div key={item.id} className="bg-white rounded-3xl border border-gray-100 p-4 md:p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link to={`/products/${item.product.slug}`} className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                      <img
                        src={item.variant?.image || item.product.images?.[0] || DEFAULT_IMAGE}
                        alt={item.product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/products/${item.product.slug}`} className="min-w-0">
                          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1 text-sm md:text-base">
                            {item.product.name}
                          </h3>
                        </Link>
                        <button
                            onClick={() => handleRemove(item.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                            title="Remove item"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.variant && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full">
                          {item.variant.name}
                        </span>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-base md:text-lg font-bold text-gray-900">
                          ₹{itemTotal.toLocaleString()}
                        </span>
                        {unitMrp > unitPrice && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{(unitMrp * item.quantity).toLocaleString()}
                            </span>
                            {itemDiscount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-md shadow-emerald-500/20">
                                {itemDiscount}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-gray-100 rounded-xl">
                          <button
                              onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                              className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-l-xl transition-colors"
                              disabled={item.quantity <= 1}
                              title="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          <span className="w-10 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                          <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-r-xl transition-colors"
                              title="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            ₹{unitPrice.toLocaleString()} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden sticky top-20 shadow-sm">
              {/* Summary Header */}
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 px-6 py-5">
                <h3 className="font-bold text-white text-lg">Order Summary</h3>
              </div>

              <div className="p-6">
                {/* Savings Callout */}
                {totalSavings > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">
                        You're saving ₹{totalSavings.toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-600">on this order</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({allItems.length} items)</span>
                    <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!canCheckoutWithoutVerification && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Professional verification required to place orders. Remove non-student items or{' '}
                        <button
                          onClick={() => {
                            sessionStorage.setItem('redirectAfterVerification', '/checkout');
                            navigate('/profile?section=verification');
                          }}
                          className="font-bold underline hover:no-underline"
                        >
                          verify your credentials
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (canCheckoutWithoutVerification) {
                      navigate("/checkout")
                    } else {
                      sessionStorage.setItem('redirectAfterVerification', '/checkout');
                      navigate('/profile?section=verification');
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl font-bold text-sm hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary-500/30"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  to="/products"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-4 font-semibold"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-5 border-t border-gray-100">
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
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      {recommendedProductsArray.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest">You May Also Like</p>
                <h2 className="text-xl font-bold text-gray-900">Based on Your Cart</h2>
              </div>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group"
            >
              <span>Explore More</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <ProductCarousel
            products={recommendedProductsArray}
            onOpenCartDrawer={(product) => {
              setCartDrawerProduct(product);
              setIsCartDrawerOpen(true);
            }}
          />
        </section>
      )}

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-lg font-bold text-gray-900">₹{total.toLocaleString()}</p>
          </div>
          <button
            onClick={() => {
              if (canCheckoutWithoutVerification) {
                navigate("/checkout")
              } else {
                sessionStorage.setItem('redirectAfterVerification', '/checkout');
                navigate('/profile?section=verification');
              }
            }}
            className="flex-1 max-w-[200px] py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
          >
            Checkout
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        product={cartDrawerProduct}
      />
    </div>
  );
}
