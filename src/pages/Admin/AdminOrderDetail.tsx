import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  RefreshCw,
  Check,
  X,
  DollarSign,
} from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09";

const ORDER_STATUSES = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => api.get(`/orders/${id}`),
    enabled: user?.role === "admin" && !!id,
  });

  useEffect(() => {
    if (data?.data) {
      setOrder(data.data);
    }
  }, [data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      api.put(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Order status updated");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });

  const confirmCODPaymentMutation = useMutation({
    mutationFn: () => api.post(`/payments/confirm-cod/${id}`),
    onSuccess: () => {
      toast.success("Payment confirmed successfully");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => {
      toast.error("Failed to confirm payment");
    },
  });

  const markCODFailedMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/payments/cod-failed/${id}`, { reason }),
    onSuccess: () => {
      toast.success("Payment marked as failed");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => {
      toast.error("Failed to mark payment as failed");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "pending_payment":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isCODOrder = order?.payments?.some((p: any) => p.method === "cod");

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
        <Link
          to="/admin/orders"
          className="text-primary-600 hover:underline mt-4 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-500">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Order Status</h2>
          <select
            value={order.status}
            onChange={(e) =>
              updateStatusMutation.mutate({ status: e.target.value })
            }
            disabled={updateStatusMutation.isPending}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-0 ${getStatusColor(order.status)} disabled:opacity-50`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">
              {order.user?.firstName} {order.user?.lastName}
            </p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
            <p className="text-sm text-gray-500">{order.user?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Subtotal</p>
            <p className="font-medium">₹{order.subtotal}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Shipping</p>
            <p className="font-medium">
              {order.shippingAmount == 0 ? "Free" : `₹${order.shippingAmount}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="font-bold text-lg text-primary-600">
              ₹{order.totalAmount}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items?.map((item: any) => (
            <div
              key={item.id}
              className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.productImage || DEFAULT_IMAGE}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.productName}</h3>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Qty: {item.quantity}</span>
                  <span className="font-medium">₹{item.totalAmount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          {(() => {
            let addressDisplay = order.shippingAddress;
            try {
              const parsed = JSON.parse(order.shippingAddress);
              if (parsed.name || parsed.addressLine1) {
                addressDisplay = [
                  parsed.name,
                  parsed.addressLine1,
                  parsed.addressLine2,
                  parsed.city,
                  parsed.state,
                  parsed.pincode,
                  parsed.country
                ].filter(Boolean).join(', ');
              }
            } catch {}
            return <p className="text-gray-600">{addressDisplay}</p>;
          })()}
        </div>
      </div>

      {order.payments?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Payment Details</h2>
            {isCODOrder && (
              <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                <DollarSign className="w-3 h-3" />
                Cash on Delivery
              </span>
            )}
          </div>
          <div className="space-y-3">
            {order.payments.map((payment: any) => (
              <div
                key={payment.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">₹{payment.amount}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {payment.method === "cod"
                      ? "Cash on Delivery"
                      : payment.method || "Card"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {payment.method === "cod" && payment.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmCODPaymentMutation.mutate()}
                        disabled={confirmCODPaymentMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        {confirmCODPaymentMutation.isPending
                          ? "Processing..."
                          : "Confirm Payment"}
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(
                            "Enter reason for marking payment as failed:",
                          );
                          if (reason) {
                            markCODFailedMutation.mutate(reason);
                          }
                        }}
                        disabled={markCODFailedMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Failed
                      </button>
                    </div>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
