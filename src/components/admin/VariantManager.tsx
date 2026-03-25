import { useState } from "react";
import { Plus, Trash2, Edit, X } from "lucide-react";
import api from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface ProductVariant {
  id?: string;
  name?: string;
  sku?: string;
  price: number;
  sellingPrice: number;
  mrp: number;
  weight?: number;
  weightUnit?: string;
  image?: string;
  images?: string[];
  color?: string;
  size?: string;
  flavor?: string;
  packQuantity: number;
  isActive: boolean;
}

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onClose: () => void;
}

export function VariantManager({ productId, variants, onClose }: VariantManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const [formData, setFormData] = useState<Partial<ProductVariant>>({
    name: "",
    sku: "",
    price: 0,
    sellingPrice: 0,
    mrp: 0,
    color: "",
    size: "",
    flavor: "",
    weight: 0,
    weightUnit: "",
    packQuantity: 1,
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/products/variants", data),
    onSuccess: () => {
      toast.success("Variant created successfully");
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
    },
    onError: () => toast.error("Failed to create variant"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/products/variants/${id}`, data),
    onSuccess: () => {
      toast.success("Variant updated successfully");
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
    },
    onError: () => toast.error("Failed to update variant"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/variants/${id}`),
    onSuccess: () => {
      toast.success("Variant deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Failed to delete variant"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      price: 0,
      sellingPrice: 0,
      mrp: 0,
      color: "",
      size: "",
      flavor: "",
      weight: 0,
      weightUnit: "",
      packQuantity: 1,
      isActive: true,
    });
    setEditingVariant(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      productId,
      price: Number(formData.price) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      mrp: Number(formData.mrp) || 0,
      weight: Number(formData.weight) || 0,
      packQuantity: Number(formData.packQuantity) || 1,
    };

    if (editingVariant?.id) {
      updateMutation.mutate({ id: editingVariant.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name || "",
      sku: variant.sku || "",
      price: variant.price,
      sellingPrice: variant.sellingPrice,
      mrp: variant.mrp,
      color: variant.color || "",
      size: variant.size || "",
      flavor: variant.flavor || "",
      weight: variant.weight || 0,
      weightUnit: variant.weightUnit || "",
      packQuantity: variant.packQuantity || 1,
      isActive: variant.isActive,
    });
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Variants</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!showForm ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                Add Variant
              </button>

              {variants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No variants yet. Add variants to offer different options (sizes, colors, flavors, etc.)
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className={`p-4 border rounded-lg ${
                        variant.isActive ? "" : "bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {variant.name || "Unnamed Variant"}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            {variant.color && <span>Color: {variant.color}</span>}
                            {variant.size && <span>Size: {variant.size}</span>}
                            {variant.flavor && <span>Flavor: {variant.flavor}</span>}
                            {variant.packQuantity > 1 && (
                              <span>Pack: {variant.packQuantity} pcs</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="font-bold text-primary-600">
                              ₹{variant.sellingPrice}
                            </span>
                            {variant.mrp > variant.sellingPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{variant.mrp}
                              </span>
                            )}
                            {variant.sku && (
                              <span className="text-xs text-gray-400">SKU: {variant.sku}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(variant)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => variant.id && deleteMutation.mutate(variant.id)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {editingVariant ? "Edit Variant" : "Add New Variant"}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Blue - Large"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color || ""}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Blue"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={formData.size || ""}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., Large"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flavor
                  </label>
                  <input
                    type="text"
                    value={formData.flavor || ""}
                    onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                    placeholder="e.g., Mint"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.sellingPrice || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.mrp || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, mrp: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Unit
                  </label>
                  <select
                    value={formData.weightUnit || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, weightUnit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="L">Liters (L)</option>
                    <option value="pcs">Pieces</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.packQuantity || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, packQuantity: Number(e.target.value) })
                    }
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingVariant
                    ? "Update Variant"
                    : "Add Variant"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default VariantManager;
