import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import VariantManager from "@/components/admin/VariantManager";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Layers,
} from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

export default function AdminProducts() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    product: any;
  }>({ show: false, product: null });
  const [showVariantManager, setShowVariantManager] = useState(false);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [variantsCount, setVariantsCount] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    sellingPrice: "",
    mrp: "",
    sku: "",
    stock: "",
    categoryId: "",
    isActive: true,
    isFeatured: false,
    expiresAt: "",
    hasVariants: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, debouncedSearch],
    queryFn: () =>
      api.get(
        `/admin/products?page=${page}&limit=12&search=${debouncedSearch}`,
      ),
    enabled: user?.role === "admin",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/admin/categories"),
    enabled: user?.role === "admin",
  });

  const categories = (categoriesData?.data as any)?.categories || [];

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post("/admin/categories", data),
    onSuccess: (response: any) => {
      toast.success("Category created successfully");
      setFormData({ ...formData, categoryId: response.data.id });
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create category",
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/products", data),
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      closeModal();
    },
    onError: () => toast.error("Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/admin/products/${id}`, data),
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      closeModal();
    },
    onError: () => toast.error("Failed to update product"),
  });

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter category name");
      return;
    }
    createCategoryMutation.mutate({ name: newCategoryName.trim() });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const products = (data?.data as any)?.products || [];
  const totalPages = (data?.data as any)?.totalPages || 1;
  const total = (data?.data as any)?.total || 0;

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

  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setVariantsCount(product.variantCount || 0);
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        price: product.price || "",
        sellingPrice: product.sellingPrice || "",
        mrp: product.mrp || "",
        sku: product.sku || "",
        stock: product.stock || "",
        categoryId: product.categoryId || "",
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        expiresAt: product.expiresAt ? product.expiresAt.split('T')[0] : "",
        hasVariants: product.hasVariants || false,
      });
      setImages(product.images || []);
    } else {
      setEditingProduct(null);
      setVariantsCount(0);
      setFormData({
        name: "",
        slug: "",
        description: "",
        shortDescription: "",
        price: "",
        sellingPrice: "",
        mrp: "",
        sku: "",
        stock: "",
        categoryId: "",
        isActive: true,
        isFeatured: false,
        expiresAt: "",
        hasVariants: false,
      });
      setImages([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setVariantsCount(0);
    setImages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.hasVariants && variantsCount === 0) {
      toast.error("Please add at least one variant before saving");
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      stock: parseInt(formData.stock) || 0,
      categoryId: formData.categoryId || null,
      images: images,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-64 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Total: {total} products</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-lg shadow-sm p-4"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </form>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="aspect-square bg-gray-100 relative">
              <img
                src={product.images?.[0] || DEFAULT_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                }}
              />
              {!product.isActive && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Inactive
                </div>
              )}
              {product.isFeatured && (
                <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                  Featured
                </div>
              )}
              {product.expiresAt && (() => {
                const expiryDate = new Date(product.expiresAt);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isExpired = daysUntilExpiry < 0;
                const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                
                if (isExpired) {
                  return (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Expired
                    </div>
                  );
                } else if (isExpiringSoon) {
                  return (
                    <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      Expires in {daysUntilExpiry} days
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500">
                {product.category?.name || "Uncategorized"}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  {product.hasVariants ? (
                    <>
                      <p className="text-sm text-gray-500">
                        {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}
                      </p>
                      {product.variantPriceRange && (
                        <p className="text-sm font-bold text-primary-600">
                          {product.variantPriceRange}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-primary-600">
                        ₹{product.sellingPrice || 0}
                      </p>
                      {product.mrp > product.sellingPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          ₹{product.mrp}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(product)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ show: true, product })}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No products found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex flex-wrap gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50">
                      {uploading ? (
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">
                            Upload
                          </span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click to upload or drag and drop. Supports JPG, PNG, WEBP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-medium text-gray-800">Product has variants</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Enable if this product comes in different options (size, color, flavor, etc.)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newHasVariants = !formData.hasVariants;
                      setFormData({ ...formData, hasVariants: newHasVariants });
                      if (!newHasVariants) {
                        setVariantsCount(0);
                      }
                    }}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.hasVariants ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.hasVariants ? "translate-x-7" : ""
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              {formData.hasVariants ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Product with Variants</span>
                    </div>
                    {variantsCount > 0 && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        {variantsCount} variant{variantsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {variantsCount > 0 ? (
                    <div className="bg-white rounded p-3 border border-purple-100">
                      <p className="text-sm text-purple-700 mb-2">
                        Pricing is managed at the variant level. Click "Manage Variants" to update prices.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProduct) {
                            setSavedProductId(String(editingProduct.id));
                            setShowVariantManager(true);
                          } else {
                            toast.error("Please save the product first to manage variants");
                          }
                        }}
                        className="text-sm text-purple-600 hover:text-purple-800 underline"
                      >
                        Manage Variants →
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-purple-700 mb-3">
                        No variants added yet. You must add at least one variant before saving this product.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (editingProduct) {
                            setSavedProductId(String(editingProduct.id));
                            setShowVariantManager(true);
                          } else {
                            if (!formData.name.trim()) {
                              toast.error("Please enter a product name first");
                              return;
                            }
                            const productData = {
                              ...formData,
                              price: parseFloat(formData.price) || 0,
                              sellingPrice: parseFloat(formData.sellingPrice) || 0,
                              mrp: parseFloat(formData.mrp) || 0,
                              stock: parseInt(formData.stock) || 0,
                              categoryId: formData.categoryId || null,
                              images: images,
                              hasVariants: true,
                            };
                            try {
                              const response = await api.post("/admin/products", productData);
                              const newProductId = response.data?.id || response.data?.data?.id;
                              if (newProductId) {
                                setSavedProductId(String(newProductId));
                                setShowVariantManager(true);
                              } else {
                                toast.error("Failed to create product. Please try again.");
                              }
                            } catch (error: any) {
                              toast.error(error?.response?.data?.message || "Failed to create product");
                            }
                          }
                        }}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        + Add Variants Now
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, sellingPrice: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.mrp}
                      onChange={(e) =>
                        setFormData({ ...formData, mrp: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={createCategoryMutation.isPending}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
                      >
                        {createCategoryMutation.isPending ? "Adding..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                        }}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={formData.categoryId}
                        onChange={(e) => {
                          if (e.target.value === "__new__") {
                            setShowNewCategoryInput(true);
                            setFormData({ ...formData, categoryId: "" });
                          } else {
                            setFormData({
                              ...formData,
                              categoryId: e.target.value,
                            });
                          }
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                        <option value="__new__">+ Add New Category</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>

              {/* Expiry Date */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

              {editingProduct?.id ? (
                <button
                  type="button"
                  onClick={() => {
                    setSavedProductId(String(editingProduct.id));
                    setShowVariantManager(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Layers className="h-4 w-4" />
                  Manage Variants
                </button>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  Save the product first to add variants.
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingProduct
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.show && (
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
                  {deleteModal.product?.name}
                </span>
                ? This will remove the product from your store.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, product: null })}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(deleteModal.product?.id);
                    setDeleteModal({ show: false, product: null });
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
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
          }}
          onVariantsChange={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          }}
        />
      )}
    </div>
  );
}
