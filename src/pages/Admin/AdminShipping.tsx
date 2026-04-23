import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { 
  Search, ChevronLeft, ChevronRight, Eye, 
  Package, X, FileText 
} from "lucide-react";

const SHIPMENT_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "NDR" },
  { value: "rto", label: "RTO" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminShipping() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNdrModal, setShowNdrModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    if (search !== "" && page !== 1) {
      setPage(1);
    }
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipping", page, status, search],
    queryFn: () =>
      api.get(
        `/admin/shipping?page=${page}&limit=20&status=${status}&search=${search}`,
      ),
    enabled: user?.role === "admin",
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin-shipping-stats"],
    queryFn: () => api.get("/admin/shipping/stats"),
    enabled: user?.role === "admin",
  });

  const shipments = ((data as any)?.data as any)?.data || [];
  const totalPages = ((data as any)?.data as any)?.pagination?.totalPages || 1;
  const total = ((data as any)?.data as any)?.pagination?.total || 0;

  const downloadLabelMutation = useMutation({
    mutationFn: (id: string) => api.get(`/admin/shipping/${id}/label`, { responseType: "blob" }),
    onSuccess: (data, id) => {
      const url = window.URL.createObjectURL(new Blob([data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `label-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Label downloaded");
    },
    onError: () => {
      toast.error("Failed to download label");
    },
  });

  const downloadManifestMutation = useMutation({
    mutationFn: (id: string) => api.get(`/admin/shipping/${id}/manifest`, { responseType: "blob" }),
    onSuccess: (data, id) => {
      const url = window.URL.createObjectURL(new Blob([data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `manifest-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Manifest downloaded");
    },
    onError: () => {
      toast.error("Failed to download manifest");
    },
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: (id: string) => api.get(`/admin/shipping/${id}/invoice`, { responseType: "blob" }),
    onSuccess: (data, id) => {
      const url = window.URL.createObjectURL(new Blob([data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded");
    },
    onError: () => {
      toast.error("Failed to download invoice");
    },
  });

  const cancelShipmentMutation = useMutation({
    mutationFn: (orderId: string) => 
      api.post(`/admin/orders/${orderId}/cancel-shipment`),
    onSuccess: () => {
      toast.success("Shipment cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-stats"] });
      setShowDetailModal(false);
    },
    onError: () => {
      toast.error("Failed to cancel shipment");
    },
  });

  const bulkCancelMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      for (const orderId of orderIds) {
        await api.post(`/admin/orders/${orderId}/cancel-shipment`);
      }
    },
    onSuccess: () => {
      toast.success("Shipments cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-stats"] });
      setSelectedShipments([]);
    },
    onError: () => {
      toast.error("Failed to cancel shipments");
    },
  });

  const retryNdrMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/shipping/ndr/${id}/retry`),
    onSuccess: () => {
      toast.success("NDR delivery scheduled");
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      setShowNdrModal(false);
    },
    onError: () => {
      toast.error("Failed to retry NDR");
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/shipping/${id}/return`),
    onSuccess: () => {
      toast.success("Return shipment created");
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      setShowReturnModal(false);
    },
    onError: () => {
      toast.error("Failed to create return");
    },
  });

  const viewShipmentDetail = async (id: string) => {
    try {
      const { data } = await api.get(`/admin/shipping/${id}`);
      setSelectedShipment(data.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Failed to load shipment details");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "in_transit":
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800";
      case "picked_up":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-orange-100 text-orange-800";
      case "rto":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = (statsData as any)?.data || {};

  const toggleSelectAll = () => {
    const validIds = shipments.filter((s: any) => s.orderId).map((s: any) => s.orderId);
    if (selectedShipments.length === validIds.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(validIds);
    }
  };

  const toggleSelect = (orderId: string) => {
    if (selectedShipments.includes(orderId)) {
      setSelectedShipments(selectedShipments.filter((s) => s !== orderId));
    } else {
      setSelectedShipments([...selectedShipments, orderId]);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-64 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
          <p className="text-gray-600">Manage shipments and track orders</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.pending || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{stats.shipped || 0}</div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.inTransit || 0}</div>
          <div className="text-sm text-gray-600">In Transit</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.delivered || 0}</div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{stats.ndr || 0}</div>
          <div className="text-sm text-gray-600">NDR</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled || 0}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID, AWB, Tracking..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {selectedShipments.length > 0 && (
          <div className="p-3 bg-indigo-50 border-b flex items-center gap-3">
            <span className="text-sm text-indigo-700">
              {selectedShipments.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkCancelMutation.mutate(selectedShipments)}
                disabled={bulkCancelMutation.isPending}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Cancel Selected
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedShipments.length > 0 && selectedShipments.length === shipments.filter((s: any) => s.shippingRocketId).length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ShipRocket ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">AWB</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Courier</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No shipments found
                  </td>
                </tr>
              ) : (
                shipments.map((shipment: any) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedShipments.includes(shipment.orderId)}
                        onChange={() => toggleSelect(shipment.orderId)}
                        className="rounded"
                        disabled={!shipment.orderId}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{shipment.order?.orderNumber || shipment.orderId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-mono">{shipment.shippingRocketId || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{shipment.awbNumber || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{shipment.courierName || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">
                        {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewShipmentDetail(shipment.id)}
                          className="p-1 text-gray-600 hover:text-indigo-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {shipment.shippingRocketId && (
                          <>
                            <button
                              onClick={() => downloadLabelMutation.mutate(shipment.id)}
                              className="p-1 text-gray-600 hover:text-indigo-600"
                              title="Download Label"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => downloadManifestMutation.mutate(shipment.id)}
                              className="p-1 text-gray-600 hover:text-indigo-600"
                              title="Download Manifest"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages} ({total} shipments)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Shipment Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Order</div>
                  <div className="font-medium">{selectedShipment.order?.orderNumber || selectedShipment.orderId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Shipment ID</div>
                  <div className="font-medium">{selectedShipment.shippingRocketId || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">AWB Number</div>
                  <div className="font-medium">{selectedShipment.awbNumber || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tracking Number</div>
                  <div className="font-medium">{selectedShipment.trackingNumber || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Courier</div>
                  <div className="font-medium">{selectedShipment.courierName || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedShipment.status)}`}>
                    {selectedShipment.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Weight</div>
                  <div className="font-medium">{selectedShipment.weight} kg</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Dimensions</div>
                  <div className="font-medium">
                    {selectedShipment.length} x {selectedShipment.breadth} x {selectedShipment.height} cm
                  </div>
                </div>

                {/* NDR Information */}
                {selectedShipment.status === 'failed' && (
                  <div className="col-span-2 pt-3 border-t mt-3">
                    <div className="text-sm text-orange-600 font-medium mb-2">NDR Information</div>
                    {selectedShipment.ndrReason && (
                      <div className="text-sm">
                        <span className="text-gray-500">Reason: </span>
                        <span className="text-gray-900">{selectedShipment.ndrReason}</span>
                      </div>
                    )}
                    {selectedShipment.ndrRetryCount !== undefined && (
                      <div className="text-sm mt-1">
                        <span className="text-gray-500">Retry Attempts: </span>
                        <span className="text-gray-900">{selectedShipment.ndrRetryCount}/2</span>
                      </div>
                    )}
                  </div>
                )}

                {/* RTO Information */}
                {selectedShipment.status === 'rto' && (
                  <div className="col-span-2 pt-3 border-t mt-3">
                    <div className="text-sm text-red-600 font-medium mb-2">RTO Information</div>
                    {selectedShipment.rtoInitiatedAt && (
                      <div className="text-sm">
                        <span className="text-gray-500">RTO Initiated: </span>
                        <span className="text-gray-900">{new Date(selectedShipment.rtoInitiatedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Last Webhook Info */}
                {selectedShipment.lastWebhookEvent && (
                  <div className="col-span-2 pt-3 border-t mt-3">
                    <div className="text-sm text-gray-500">Last Webhook Event</div>
                    <div className="font-medium">{selectedShipment.lastWebhookEvent}</div>
                    {selectedShipment.lastWebhookAt && (
                      <div className="text-xs text-gray-400">
                        {new Date(selectedShipment.lastWebhookAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedShipment.tracking && selectedShipment.tracking.shipmentTrack && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Tracking Timeline</div>
                  <div className="space-y-2">
                    {selectedShipment.tracking.shipmentTrack.map((track: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="text-gray-500">
                          {new Date(track.date).toLocaleDateString()}
                        </div>
                        <div>{track.activity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedShipment.shippingRocketId && selectedShipment.status !== "cancelled" && selectedShipment.status !== "delivered" && (
                  <>
                    <button
                      onClick={() => downloadLabelMutation.mutate(selectedShipment.id)}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Download Label
                    </button>
                    <button
                      onClick={() => downloadManifestMutation.mutate(selectedShipment.id)}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Download Manifest
                    </button>
                    <button
                      onClick={() => downloadInvoiceMutation.mutate(selectedShipment.id)}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Download Invoice
                    </button>
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Create Return
                    </button>
                    {selectedShipment.status === "failed" && (
                      <button
                        onClick={() => setShowNdrModal(true)}
                        className="px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Retry NDR
                      </button>
                    )}
                    <button
                      onClick={() => cancelShipmentMutation.mutate(selectedShipment.orderId)}
                      disabled={!selectedShipment.orderId}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Cancel Shipment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showNdrModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">NDR Action</h2>
              <button
                onClick={() => setShowNdrModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p>What would you like to do with this NDR shipment?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => retryNdrMutation.mutate(selectedShipment.id)}
                  className="flex-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Retry Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Create Return Shipment</h2>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p>Are you sure you want to create a return shipment?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => createReturnMutation.mutate(selectedShipment.id)}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}