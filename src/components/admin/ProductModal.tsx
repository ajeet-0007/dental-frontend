import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";
import VariantManager from "@/components/admin/VariantManager";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { X, Trash2, Upload } from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

const INITIAL_FORM_DATA = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  sellingPrice: "",
  mrp: "",
  sku: "",
  stock: "",
  categoryId: "",
  brandId: "",
  departmentIds: [] as number[],
  isActive: true,
  isFeatured: false,
  expiresAt: "",
  hasVariants: false,
  features: "",
  keySpecifications: "",
  packaging: "",
  directionToUse: "",
  additionalInfo: "",
  warranty: "",
};

export function ProductFormModal({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: any;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variantsCount, setVariantsCount] = useState(0);
  const [showVariantManager, setShowVariantManager] = useState(false);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/admin/categories"),
    enabled: open,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => api.get("/brands/admin/all"),
    enabled: open,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: () => api.get("/departments?active=false"),
    enabled: open,
  });

  const categories = (categoriesData?.data as any)?.categories || [];
  const brands = Array.isArray(brandsData?.data) ? brandsData.data : [];
  const departments = Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : [];

  useEffect(() => {
    if (!open) return;
    setVariantsCount(product?.variantCount || 0);
    setFormData({
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      shortDescription: product?.shortDescription || "",
      sellingPrice: product?.sellingPrice || "",
      mrp: product?.mrp || "",
      sku: product?.sku || "",
      stock: product?.stock || "",
      categoryId: product?.categoryId || "",
      brandId: product?.brandId?.toString() || "",
      departmentIds: product?.departments?.map((d: any) => d.id) || [],
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      expiresAt: product?.expiresAt ? product.expiresAt.split("T")[0] : "",
      hasVariants: product?.hasVariants || false,
      features: product?.features || "",
      keySpecifications: product?.keySpecifications || "",
      packaging: product?.packaging || "",
      directionToUse: product?.directionToUse || "",
      additionalInfo: product?.additionalInfo || "",
      warranty: product?.warranty || "",
    });
    setImages(product?.images || []);
    setUploading(false);
    setShowVariantManager(false);
    setSavedProductId(null);
  }, [open, product]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/products", data),
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onSaved?.();
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/admin/products/${id}`, data),
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onSaved?.();
      closeModal();
    },
    onError: () => toast.error("Failed to update product"),
  });

  const closeModal = () => {
    setShowVariantManager(false);
    setSavedProductId(null);
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/imagekit/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data?.url) {
          newImages.push(response.data.url);
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(
          `Failed to upload ${file.name}: ${error?.response?.data?.message || error?.message || "Unknown error"}`,
        );
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!formData.brandId) {
      toast.error("Please select a brand");
      return;
    }

    if (formData.hasVariants && variantsCount === 0) {
      toast.error("Please add at least one variant before saving");
      return;
    }

    const productData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      shortDescription: formData.shortDescription,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      sku: formData.sku,
      stock: parseInt(formData.stock) || 0,
      categoryId: formData.categoryId || null,
      brandId: formData.brandId ? parseInt(formData.brandId) : null,
      departmentIds: formData.departmentIds,
      images: images,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      expiresAt: formData.expiresAt || null,
      hasVariants: formData.hasVariants,
      features: formData.features,
      keySpecifications: formData.keySpecifications,
      packaging: formData.packaging,
      directionToUse: formData.directionToUse,
      additionalInfo: formData.additionalInfo,
      warranty: formData.warranty,
    };

    if (product) {
      updateMutation.mutate({ id: product.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  return (
    <>
      {open && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">
              {product ? "Edit Product" : "Add Product"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-48 border-r bg-gray-50 p-4 hidden lg:block">
              <nav className="space-y-1">
                {["Basic Info", "Pricing", "Organization", "Details", "Additional"].map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => document.getElementById(section.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    {section}
                  </button>
                ))}
              </nav>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Basic Info Section */}
              <div id="basic-info">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">1</span>
                  Basic Information
                </h3>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                    <div className="flex flex-wrap gap-3">
                      {images.map((img, index) => (
                        <div key={index} className="relative w-20 h-20">
                          <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} />
                          <button type="button" onClick={() => removeImage(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50">
                        {uploading ? (
                          <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-500">Upload</span>
                          </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" disabled={uploading} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                    <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
                  <input type="text" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Brief product summary" />
                </div>

                <div className="mt-4">
                  <RichTextEditor
                    label="Description"
                    value={formData.description}
                    onChange={(data) => setFormData({ ...formData, description: data })}
                    placeholder="Enter product description..."
                    minHeight="120px"
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div id="pricing">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">2</span>
                  Pricing
                </h3>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-purple-900 text-sm">Product has variants</span>
                      <p className="text-xs text-purple-700">Enable for size, color, flavor options</p>
                    </div>
                    <button type="button" onClick={() => { const newHasVariants = !formData.hasVariants; setFormData({ ...formData, hasVariants: newHasVariants }); if (!newHasVariants) setVariantsCount(0); }} className={`relative w-12 h-6 rounded-full transition-colors ${formData.hasVariants ? "bg-purple-600" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.hasVariants ? "translate-x-6" : ""}`} />
                    </button>
                  </div>
                </div>

                {formData.hasVariants ? (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-purple-700">
                        {variantsCount > 0 ? `${variantsCount} variant(s) added` : "No variants added yet"}
                      </p>
                      <button type="button" onClick={() => {
                        if (product?.id) {
                          setSavedProductId(String(product.id));
                          setShowVariantManager(true);
                        } else {
                          if (!formData.name.trim()) {
                            toast.error("Please enter a product name first");
                            return;
                          }
                          if (!formData.categoryId) {
                            toast.error("Please select a category first");
                            return;
                          }
                          if (!formData.brandId) {
                            toast.error("Please select a brand first");
                            return;
                          }
                          createMutation.mutate({
                            ...formData,
                            sellingPrice: parseFloat(formData.sellingPrice) || 0,
                            mrp: parseFloat(formData.mrp) || 0,
                            stock: parseInt(formData.stock) || 0,
                            categoryId: formData.categoryId || null,
                            images: images,
                            hasVariants: true,
                          }, {
                            onSuccess: (response: any) => {
                              const newProductId = response.data?.id || response?.id;
                              if (newProductId) {
                                setSavedProductId(String(newProductId));
                                setShowVariantManager(true);
                              }
                            }
                          });
                        }
                      }} className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                        {product?.id ? "Manage" : "Add"} Variants →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                      <input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">MRP (₹)</label>
                      <input type="number" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Organization Section */}
              <div id="organization">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">3</span>
                  Organization
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                    <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-primary-500" required>
                      <option value="">Select</option>
                      {categories.map((cat: any) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Brand *</label>
                    <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-primary-500" required>
                      <option value="">Select</option>
                      {brands.map((brand: any) => (<option key={brand.id} value={brand.id}>{brand.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input type="date" value={formData.expiresAt || ""} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Departments</label>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept: any) => (
                      <label key={dept.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg cursor-pointer text-xs transition-colors ${formData.departmentIds.includes(dept.id) ? "bg-primary-50 border-primary-500 text-primary-700" : "hover:bg-gray-50"}`}>
                        <input type="checkbox" checked={formData.departmentIds.includes(dept.id)} onChange={(e) => { if (e.target.checked) setFormData({ ...formData, departmentIds: [...formData.departmentIds, dept.id] }); else setFormData({ ...formData, departmentIds: formData.departmentIds.filter((id) => id !== dept.id) }); }} className="w-3.5 h-3.5 text-primary-600 rounded" />
                        <span>{dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-700">Featured</span>
                  </label>
                </div>
              </div>

              {/* Details Section */}
              <div id="details">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">4</span>
                  Product Details
                </h3>

                {/* Features */}
                <div className="mb-4">
                  <RichTextEditor
                    label="Features"
                    value={formData.features}
                    onChange={(data) => setFormData({ ...formData, features: data })}
                    placeholder="Enter product features..."
                    minHeight="150px"
                  />
                </div>

                {/* Key Specifications */}
                <div className="mb-4">
                  <RichTextEditor
                    label="Key Specifications"
                    value={formData.keySpecifications}
                    onChange={(data) => setFormData({ ...formData, keySpecifications: data })}
                    placeholder="Enter key specifications..."
                    minHeight="120px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Packaging</label>
                    <textarea value={formData.packaging} onChange={(e) => setFormData({ ...formData, packaging: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Enter packaging details (one per line)" />
                    <p className="text-[10px] text-gray-500 mt-1">Each line = bullet point</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Warranty</label>
                    <textarea value={formData.warranty} onChange={(e) => setFormData({ ...formData, warranty: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Enter warranty details (one per line)" />
                    <p className="text-[10px] text-gray-500 mt-1">Each line = bullet point</p>
                  </div>
                </div>
              </div>

              {/* Additional Section */}
              <div id="additional">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">5</span>
                  Additional Information
                </h3>

                <div>
                  <RichTextEditor
                    label="Directions to Use"
                    value={formData.directionToUse}
                    onChange={(data) => setFormData({ ...formData, directionToUse: data })}
                    placeholder="Enter directions for use..."
                    minHeight="120px"
                  />
                </div>

                <div className="mt-4">
                  <RichTextEditor
                    label="Additional Information"
                    value={formData.additionalInfo}
                    onChange={(data) => setFormData({ ...formData, additionalInfo: data })}
                    placeholder="Enter additional information..."
                    minHeight="120px"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {showVariantManager && savedProductId && (
        <VariantManager
          productId={savedProductId}
          onClose={() => {
            setShowVariantManager(false);
            setSavedProductId(null);
            onSaved?.();
          }}
          onVariantsChange={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
            onSaved?.();
          }}
        />
      )}
    </>
  );
}

export function DeleteProductModal({
  open,
  product,
  onClose,
  onDeleted,
}: {
  open: boolean;
  product: any;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onDeleted?.();
      onClose();
    },
    onError: () => toast.error("Failed to delete product"),
  });

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Product
              </h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {product.name}
            </span>
            ? This will remove the product from your store.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(product.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
