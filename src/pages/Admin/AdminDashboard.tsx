import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role !== "admin") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get("/admin/dashboard"),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const stats = data?.data || {};
  const recentOrders = stats.recentOrders || [];
  const topProducts = stats.topProducts || [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "bg-green-500",
      change: "+12.5%",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders || 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      change: "+8.2%",
    },
    {
      label: "Total Products",
      value: stats.totalProducts || 0,
      icon: Package,
      color: "bg-purple-500",
      change: "+3.1%",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers || 0,
      icon: Users,
      color: "bg-orange-500",
      change: "+5.4%",
    },
  ];

  const statusCounts =
    stats.ordersByStatus?.reduce((acc: any, item: any) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {}) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  {stat.change}
                </span>
                <span className="text-sm text-gray-400">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-4">
          <Clock className="w-10 h-10 text-orange-500" />
          <div>
            <p className="text-2xl font-bold text-orange-700">
              {statusCounts.pending_payment || 0}
            </p>
            <p className="text-sm text-orange-600">Pending Payment</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
          <CheckCircle className="w-10 h-10 text-blue-500" />
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {statusCounts.confirmed || 0}
            </p>
            <p className="text-sm text-blue-600">Confirmed</p>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-4">
          <Package className="w-10 h-10 text-indigo-500" />
          <div>
            <p className="text-2xl font-bold text-indigo-700">
              {(statusCounts.processing || 0) + (statusCounts.shipped || 0)}
            </p>
            <p className="text-sm text-indigo-600">Processing/Shipped</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-4">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <div>
            <p className="text-2xl font-bold text-red-700">
              {(statusCounts.cancelled || 0) +
                (statusCounts.payment_failed || 0)}
            </p>
            <p className="text-sm text-red-600">Cancelled/Failed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h2>
            <a
              href="/admin/orders"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.slice(0, 5).map((order: any) => (
                  <tr key={order.id} className="text-sm">
                    <td className="py-3 font-medium">{order.orderNumber}</td>
                    <td className="py-3 text-gray-500">
                      {order.user?.firstName} {order.user?.lastName}
                    </td>
                    <td className="py-3 font-medium">₹{order.totalAmount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "pending_payment"
                              ? "bg-orange-100 text-orange-700"
                              : order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : order.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Selling Products
            </h2>
            <a
              href="/admin/products"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </a>
          </div>
          <div className="space-y-4">
            {topProducts.map((product: any, index: number) => (
              <div key={product.productId} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {product.productName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.totalSold} sold
                  </p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No sales data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
