import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { Search, AlertTriangle, CheckCircle, Package, X } from "lucide-react";

export default function AdminInventory() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => api.get("/admin/inventory"),
    enabled: user?.role === "admin",
  });

  const updateMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => api.put(`/admin/inventory/${productId}`, { quantity }),
    onSuccess: () => {
      toast.success("Inventory updated");
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      closeModal();
    },
    onError: () => toast.error("Failed to update inventory"),
  });

  const inventory = data?.data?.inventory || [];
  const lowStock = data?.data?.lowStock || [];
  const totalProducts = data?.data?.totalProducts || 0;
  const lowStockCount = data?.data?.lowStockCount || 0;

  const filteredInventory = search
    ? inventory.filter(
        (item: any) =>
          item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.productId?.includes(search),
      )
    : inventory;

  const openModal = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity.toString());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setNewQuantity("");
  };

  const handleUpdate = () => {
    if (selectedItem && newQuantity) {
      updateMutation.mutate({
        productId: selectedItem.productId,
        quantity: parseInt(newQuantity),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-64 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500">Manage product stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-xl">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {totalProducts - lowStockCount}
            </p>
            <p className="text-sm text-gray-500">In Stock</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            <p className="text-sm text-gray-500">Low Stock</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-700">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-red-600">
                  {item.product?.name || item.productId}
                </span>
                <span className="font-medium text-red-700">
                  Only {item.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Low Stock Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item: any) => {
                const isLowStock =
                  item.quantity <= (item.lowStockThreshold || 10);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {item.product?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {item.productId}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.product?.sku || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.lowStockThreshold || 10}
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(item)}
                        className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Stock Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Update Stock</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium">
                  {selectedItem.product?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="font-medium">{selectedItem.quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Quantity
                </label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="0"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
