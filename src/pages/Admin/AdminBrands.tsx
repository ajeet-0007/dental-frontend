import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Award,
} from "lucide-react";

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBrands() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    brand: Brand | null;
  }>({ show: false, brand: null });

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const response = await api.get("/brands/admin/all");
      return response.data;
    },
  });

  const allBrands: Brand[] = Array.isArray(brandsData) ? brandsData : [];
  const filteredBrands = search
    ? allBrands.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allBrands;

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/brands", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("Brand created successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create brand");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const response = await api.put(`/brands/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("Brand updated successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update brand");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/brands/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("Brand deleted successfully");
      setDeleteModal({ show: false, brand: null });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete brand");
      setDeleteModal({ show: false, brand: null });
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name || "",
        slug: brand.slug || "",
        logo: brand.logo || "",
        description: brand.description || "",
        sortOrder: brand.sortOrder || 0,
        isActive: brand.isActive ?? true,
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: "",
        slug: "",
        logo: "",
        description: "",
        sortOrder: 0,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      logo: formData.logo || undefined,
      description: formData.description.trim() || undefined,
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
    };

    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const confirmDelete = (brand: Brand) => {
    setDeleteModal({ show: true, brand });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage product brands and manufacturers
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Add Brand
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
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
        ) : filteredBrands.length === 0 ? (
          <div className="p-8 text-center">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No brands found</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Add your first brand
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
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
                {filteredBrands.map((brand: Brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-16 h-10 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/64x40?text=Logo";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Award className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {brand.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {brand.productCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {brand.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          brand.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {brand.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openModal(brand)}
                        className="p-2 text-gray-400 hover:text-primary-600"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(brand)}
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
                {editingBrand ? "Edit Brand" : "Add Brand"}
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
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter brand name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="auto-generated-from-name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter brand description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <ImageUpload
                label="Brand Logo"
                value={formData.logo}
                onChange={(url) =>
                  setFormData((prev) => ({ ...prev, logo: url || "" }))
                }
              />

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
                    : editingBrand
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
            <h2 className="text-lg font-semibold mb-4">Delete Brand</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "
              <span className="font-medium">{deleteModal.brand?.name}</span>
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, brand: null })}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteModal.brand &&
                  deleteMutation.mutate(deleteModal.brand.id)
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
