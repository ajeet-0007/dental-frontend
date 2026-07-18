import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Tag, ShoppingBag, Shield, Check, Truck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (isAuthenticated && data?.data) {
      setCart(data.data, data.data.length);
    }
  }, [data, isAuthenticated, setCart]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cart/${id}`),
    onSuccess: (_, deletedId) => {
      removeItem(deletedId);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.put(`/cart/${id}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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

  const taxRate = Number(import.meta.env.VITE_TAX_RATE || 18) / 100;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

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

  const handleQuantityChange = async (id: string, quantity: number) => {
    updateQuantity(id, quantity);
    if (isAuthenticated) {
      try {
        await updateMutation.mutateAsync({ id, quantity });
      } catch {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    }
  };

  if (allItems.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShoppingCart className="h-9 w-9 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Looks like you haven't added anything yet. Start exploring our products!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30"
            >
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-3 max-w-xl mb-8">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-48 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-6 bg-gray-200 rounded mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-sm text-gray-500">{allItems.length} item{allItems.length !== 1 ? 's' : ''} in your cart</p>
              </div>
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
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link to={`/products/${item.product.slug}`} className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 p-1">
                      <img
                        src={item.variant?.image || item.product.images?.[0] || DEFAULT_IMAGE}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/products/${item.product.slug}`} className="min-w-0">
                          <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1 text-sm">
                            {item.product.name}
                          </h3>
                        </Link>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.variant && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                          {item.variant.name}
                        </span>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">
                          ₹{itemTotal.toLocaleString()}
                        </span>
                        {unitMrp > unitPrice && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{(unitMrp * item.quantity).toLocaleString()}
                            </span>
                            {itemDiscount > 0 && (
                              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                {itemDiscount}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-gray-100 rounded-full">
                          <button
                            onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-semibold text-sm text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-400">
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
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-20">
              {/* Summary Header */}
              <div className="bg-gradient-to-r from-primary-500 to-blue-600 px-5 py-4">
                <h3 className="font-semibold text-white">Order Summary</h3>
              </div>

              <div className="p-5">
                {/* Savings Callout */}
                {totalSavings > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Tag className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700">
                        You're saving ₹{totalSavings.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-green-600">on this order</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({allItems.length} items)</span>
                    <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({taxRate * 100}% GST)</span>
                    <span className="font-medium text-gray-900">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!canCheckoutWithoutVerification && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Professional verification required to place orders. Remove non-student items or{' '}
                        <button
                          onClick={() => {
                            sessionStorage.setItem('redirectAfterVerification', '/checkout');
                            navigate('/profile?section=verification');
                          }}
                          className="font-semibold underline hover:no-underline"
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
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  to="/products"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-3 font-medium"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-700">Free Delivery</p>
                        <p className="text-[9px] text-gray-400">On all orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-700">Secure Payment</p>
                        <p className="text-[9px] text-gray-400">100% protected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-700">Quality Assured</p>
                        <p className="text-[9px] text-gray-400">Genuine products</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-700">Easy Returns</p>
                        <p className="text-[9px] text-gray-400">7-day returns</p>
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
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <span>Explore More</span>
              <ArrowRight className="h-4 w-4" />
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
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
            className="flex-1 max-w-[200px] py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
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
