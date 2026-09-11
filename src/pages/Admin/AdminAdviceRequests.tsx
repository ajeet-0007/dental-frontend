import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MessageSquare,
  Stethoscope,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
];

interface AdviceRequest {
  id: number;
  doctorName: string;
  clinicName?: string;
  email: string;
  phone?: string;
  equipmentName: string;
  equipmentCategory: string;
  equipmentBrand?: string;
  problemDescription: string;
  status: string;
  isActive: boolean;
  userId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-800";
    case "reviewed":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function AdminAdviceRequests() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<AdviceRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== "" && page !== 1) {
      setPage(1);
    }
  }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-advice-requests", page, status, debouncedSearch],
    queryFn: () =>
      api.get(
        `/advice-requests/admin?page=${page}&limit=10&status=${status}&search=${debouncedSearch}`,
      ),
    enabled: user?.role === "admin",
    placeholderData: (prevData) => prevData,
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin-advice-requests-stats"],
    queryFn: () => api.get("/advice-requests/admin/stats"),
    enabled: user?.role === "admin",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminNotes,
    }: {
      id: number;
      status: string;
      adminNotes?: string;
    }) => api.patch(`/advice-requests/admin/${id}/status`, { status, adminNotes }),
    onSuccess: () => {
      toast.success("Request updated");
      queryClient.invalidateQueries({ queryKey: ["admin-advice-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-advice-requests-stats"] });
      setSelected(null);
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const requests = (data?.data as any)?.data || [];
  const totalPages = (data?.data as any)?.totalPages || 1;
  const total = (data?.data as any)?.total || 0;
  const stats = (statsData?.data as any) || {};

  const openDetail = (request: AdviceRequest) => {
    setSelected(request);
    setAdminNotes(request.adminNotes || "");
  };

  if (isLoading && !data) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Free Advice Requests
          </h1>
          <p className="text-gray-500">
            Total: {total} · Pending: {stats.pending ?? "-"} · Reviewed:{" "}
            {stats.reviewed ?? "-"} · Resolved: {stats.resolved ?? "-"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctor, equipment, brand, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request: any) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    #{request.id}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.doctorName}
                      </p>
                      <p className="text-sm text-gray-500">{request.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.equipmentName}
                      </p>
                      {request.equipmentBrand && (
                        <p className="text-sm text-gray-500">
                          {request.equipmentBrand}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {request.equipmentCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        request.status,
                      )}`}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(request.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openDetail(request)}
                      className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 text-sm font-medium"
                    >
                      <Eye className="w-5 h-5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No advice requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of{" "}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Request #{selected.id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(selected.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Doctor
                  </p>
                  <p className="font-medium text-gray-900 mt-1">
                    {selected.doctorName}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Clinic
                  </p>
                  <p className="font-medium text-gray-900 mt-1">
                    {selected.clinicName || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="font-medium text-primary-600 mt-1 block"
                  >
                    {selected.email}
                  </a>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Phone
                  </p>
                  <p className="font-medium text-gray-900 mt-1">
                    {selected.phone || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Equipment
                  </p>
                  <p className="font-medium text-gray-900 mt-1">
                    {selected.equipmentName}
                  </p>
                  {selected.equipmentBrand && (
                    <p className="text-sm text-gray-500">
                      {selected.equipmentBrand}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Category
                  </p>
                  <p className="font-medium text-gray-900 mt-1">
                    {selected.equipmentCategory}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selected.status,
                    )}`}
                  >
                    {selected.status.charAt(0).toUpperCase() +
                      selected.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Problem Description
                </p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selected.problemDescription}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Update Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((s) => s.value !== "").map((s) => (
                    <button
                      key={s.value}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selected.id,
                          status: s.value,
                          adminNotes,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                        selected.status === s.value
                          ? "bg-primary-600 text-white border-primary-600"
                          : "border-gray-300 text-gray-700 hover:border-primary-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes about diagnosis / advice given (saved with status update)..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none transition-all"
                />
                {!adminNotes && selected.adminNotes && (
                  <p className="text-xs text-gray-400 mt-1">
                    Existing: {selected.adminNotes}
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-3">
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="w-4 h-4" />
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}