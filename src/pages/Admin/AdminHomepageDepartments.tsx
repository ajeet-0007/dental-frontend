import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Layers,
} from "lucide-react";

interface HomepageDepartment {
  id: number;
  departmentId: number;
  sortOrder: number;
  isActive: boolean;
  department?: {
    id: number;
    name: string;
    slug: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

export default function AdminHomepageDepartments() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageDepartment | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    section: HomepageDepartment | null;
  }>({ show: false, section: null });

  const [formData, setFormData] = useState({
    departmentId: "",
    sortOrder: 0,
    isActive: true,
  });

  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ["admin-homepage-departments"],
    queryFn: async () => {
      const response = await api.get("/homepage-departments/admin/all");
      return response.data;
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["admin-departments-options"],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    },
  });

  const allSections: HomepageDepartment[] = Array.isArray(sectionsData)
    ? sectionsData
    : [];
  const allDepartments: Department[] = Array.isArray(departmentsData)
    ? departmentsData
    : [];

  const configuredDepartmentIds = new Set(
    allSections.map((s) => s.departmentId),
  );

  const filteredSections = search
    ? allSections.filter((s) =>
        (s.department?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : allSections;

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/homepage-departments", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-departments"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-departments"] });
      toast.success("Department section created successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create department section");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await api.put(`/homepage-departments/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-departments"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-departments"] });
      toast.success("Department section updated successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update department section");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/homepage-departments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-departments"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-departments"] });
      toast.success("Department section removed successfully");
      setDeleteModal({ show: false, section: null });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete department section");
      setDeleteModal({ show: false, section: null });
    },
  });

  const openModal = (section?: HomepageDepartment) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        departmentId: section.departmentId.toString(),
        sortOrder: section.sortOrder || 0,
        isActive: section.isActive ?? true,
      });
    } else {
      setEditingSection(null);
      setFormData({
        departmentId: "",
        sortOrder: allSections.length,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSection(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) {
      toast.error("Please select a department");
      return;
    }

    const payload = {
      departmentId: parseInt(formData.departmentId, 10),
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
    };

    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const confirmDelete = (section: HomepageDepartment) => {
    setDeleteModal({ show: true, section });
  };

  const availableDepartments = allDepartments.filter(
    (d) => !configuredDepartmentIds.has(d.id) || d.id === editingSection?.departmentId,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Departments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the "Department Collections" product section on the homepage
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No homepage department sections configured</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Add your first department
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sort Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {section.department?.image ? (
                          <img
                            src={section.department.image}
                            alt={section.department.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Layers className="w-5 h-5 text-primary-600" />
                          </div>
                        )}
                        <div className="font-medium text-gray-900">
                          {section.department?.name || `Department #${section.departmentId}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {section.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          section.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {section.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openModal(section)}
                        className="p-2 text-gray-400 hover:text-primary-600"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(section)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingSection ? "Edit Department Section" : "Add Department Section"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      departmentId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a department</option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Featured products from this department will be shown on the homepage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.value === "true",
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingSection
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Remove Department Section</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove "
              <span className="font-medium">{deleteModal.section?.department?.name}</span>
              " from the homepage? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, section: null })}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteModal.section &&
                  deleteMutation.mutate(deleteModal.section.id)
                }
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
