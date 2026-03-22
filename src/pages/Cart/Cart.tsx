import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
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
      sum + (item.variant?.price || item.product.sellingPrice) * item.quantity,
    0,
  );

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
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="w-24 h-24 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

      {allItems.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {allItems.map((item: any) => (
              <div key={item.id} className="flex gap-4 py-4 border-b">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.images?.[0] || item.variant?.image ? (
                    <img
                      src={item.variant?.image || item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={DEFAULT_IMAGE}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  {item.variant && (
                    <p className="text-sm text-gray-500">{item.variant.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="p-2 hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        className="p-2 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹
                        {(
                          (item.variant?.price || item.product.sellingPrice) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{subtotal > 500 ? "Free" : "₹50.00"}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    ₹{(subtotal + (subtotal > 500 ? 0 : 50)).toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
