import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Tag } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useEffect } from "react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem, updateQuantity, setCart } = useCartStore();

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
    onSuccess: () => {
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

  const subtotal = allItems.reduce(
    (sum: number, item: any) =>
      sum + (item.variant?.sellingPrice || item.product.sellingPrice || item.product.price) * item.quantity,
    0,
  );

  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm text-gray-500">{allItems.length} item{allItems.length !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {allItems.map((item: any) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Product Image */}
                <Link to={`/products/${item.product.slug}`} className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={item.variant?.image || item.product.images?.[0] || DEFAULT_IMAGE}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Info */}
                <Link to={`/products/${item.product.slug}`} className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </h3>
                  {item.variant && (
                    <p className="text-sm text-gray-500 mt-0.5">{item.variant.name}</p>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{((item.variant?.sellingPrice || item.product.sellingPrice || item.product.price) * item.quantity).toLocaleString()}
                    </span>
                    {(item.variant?.price || item.product.mrp) && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{((item.variant?.price || item.product.mrp || item.product.price) * item.quantity).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Unit Price */}
                  <p className="text-xs text-gray-400 mt-0.5">
                    ₹{(item.variant?.sellingPrice || item.product.sellingPrice || item.product.price).toLocaleString()} per unit
                  </p>
                </Link>

                {/* Actions */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                      className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 font-medium text-sm min-w-[32px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({allItems.length} items)</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (18% GST)</span>
                <span className="font-medium">₹{tax.toLocaleString()}</span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
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
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Package className="h-4 w-4 text-gray-400" />
                <span>Secure packaging & fast delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Tag className="h-4 w-4 text-gray-400" />
                <span>Best prices guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
