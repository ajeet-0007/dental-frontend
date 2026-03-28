import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X, Save, Layers, Check } from "lucide-react";
import api from "@/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface ProductOptionValue {
  id?: number;
  value: string;
  hexCode?: string;
  swatchUrl?: string;
  position?: number;
}

interface ProductOption {
  id?: number;
  productId?: number;
  name: string;
  position?: number;
  values: ProductOptionValue[];
}

interface ProductVariantOption {
  optionId: number;
  optionName: string;
  optionValueId: number;
  optionValue: string;
}

interface ProductVariant {
  id?: string;
  productId?: string;
  name?: string;
  sku?: string;
  price: number;
  sellingPrice: number;
  mrp: number;
  weight?: number;
  weightUnit?: string;
  image?: string;
  images?: string[];
  packQuantity: number;
  isActive: boolean;
  expiresAt?: string;
  options?: ProductVariantOption[];
  isBase?: boolean;
}

interface VariantManagerProps {
  productId: string;
  onClose: () => void;
  onVariantsChange?: () => void;
}

export default function VariantManager({ productId, onClose, onVariantsChange }: VariantManagerProps) {
  const [view, setView] = useState<'list' | 'options' | 'generate'>('list');
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [options, setOptions] = useState<ProductOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editOptionValues, setEditOptionValues] = useState('');
  const [editingOptionHexCode, setEditingOptionHexCode] = useState('');

  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string[]>>({});
  const [bulkPrice, setBulkPrice] = useState<{ price?: number; sellingPrice?: number; mrp?: number }>({});
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [inventoryStock, setInventoryStock] = useState<Record<string, number>>({});

  const { data: variantsData, refetch } = useQuery({
    queryKey: ['product', productId, 'variants'],
    queryFn: () => api.get(`/products/${productId}/variants`),
    enabled: !!productId,
  });

  const { data: productData, refetch: refetchProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get(`/products/${productId}`),
    enabled: !!productId,
  });

  const variants: ProductVariant[] = Array.isArray(variantsData?.data) ? variantsData.data : [];
  const product = productData?.data;
  const inventories = product?.inventories || [];

  const updateInventoryMutation = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      api.put(`/products/variants/${variantId}/inventory`, { quantity }),
    onSuccess: () => {
      toast.success("Inventory updated");
      refetchProduct();
      setEditingInventoryId(null);
    },
    onError: () => toast.error("Failed to update inventory"),
  });

  useEffect(() => {
    const stockMap: Record<string, number> = {};
    inventories.forEach((inv: any) => {
      stockMap[inv.productVariantId] = inv.quantity;
    });
    setInventoryStock(stockMap);
  }, [inventories]);

  useEffect(() => {
    if (product?.options) {
      setOptions(product.options);
      const initialSelected: Record<string, string[]> = {};
      product.options.forEach((opt: ProductOption) => {
        initialSelected[opt.name] = opt.values?.map((v: ProductOptionValue) => v.value) || [];
      });
      setSelectedOptionValues(initialSelected);
    }
  }, [product]);

  const updateProductMutation = useMutation({
    mutationFn: (data: { options: ProductOption[] }) =>
      api.put(`/admin/products/${productId}`, {
        options: data.options
      }),
    onSuccess: () => {
      toast.success("Options updated");
      refetch();
      refetchProduct();
    },
    onError: () => toast.error("Failed to update options"),
  });

  useEffect(() => {
    return () => {
      setShowForm(false);
      setEditingVariant(null);
      setView('list');
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/products/variants", data),
    onSuccess: () => {
      toast.success("Variant created successfully");
      refetch();
      onVariantsChange?.();
      resetForm();
    },
    onError: () => toast.error("Failed to create variant"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/products/variants/${id}`, data),
    onSuccess: () => {
      toast.success("Variant updated successfully");
      refetch();
      onVariantsChange?.();
      resetForm();
    },
    onError: () => toast.error("Failed to update variant"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/variants/${id}`),
    onSuccess: () => {
      toast.success("Variant deleted successfully");
      refetch();
      onVariantsChange?.();
    },
    onError: () => toast.error("Failed to delete variant"),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (variants: any[]) => api.post("/products/variants/bulk", { variants }),
    onSuccess: () => {
      toast.success("Variants created successfully");
      refetch();
      onVariantsChange?.();
      setView('list');
    },
    onError: () => toast.error("Failed to create variants"),
  });

  const [formData, setFormData] = useState<Partial<ProductVariant>>({
    name: "",
    sku: "",
    price: 0,
    sellingPrice: 0,
    mrp: 0,
    weight: 0,
    weightUnit: "",
    packQuantity: 1,
    isActive: true,
    expiresAt: "",
    options: [],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      price: product?.sellingPrice || 0,
      sellingPrice: product?.sellingPrice || 0,
      mrp: product?.mrp || 0,
      weight: 0,
      weightUnit: "",
      packQuantity: 1,
      isActive: true,
      expiresAt: "",
      options: [],
    });
    setEditingVariant(null);
    setShowForm(false);
  };

  const handleAddOption = () => {
    if (!newOptionName.trim()) {
      toast.error("Option name is required");
      return;
    }
    if (!newOptionValues.trim()) {
      toast.error("At least one value is required");
      return;
    }

    const values = newOptionValues.split(',').map(v => v.trim()).filter(Boolean);
    const newOpt: ProductOption = {
      name: newOptionName.trim(),
      values: values.map((value, idx) => ({ value, position: idx })),
    };

    const updated = [...options, newOpt];
    setOptions(updated);
    setSelectedOptionValues(prev => ({ ...prev, [newOpt.name]: values }));

    updateProductMutation.mutate({ options: updated });

    setNewOptionName('');
    setNewOptionValues('');
  };

  const handleUpdateOption = (index: number) => {
    if (!editOptionValues.trim()) {
      toast.error("At least one value is required");
      return;
    }

    const values = editOptionValues.split(',').map(v => v.trim()).filter(Boolean);
    const updated = [...options];
    updated[index] = {
      ...updated[index],
      values: values.map((value, idx) => ({
        ...updated[index].values[idx],
        value,
        position: idx,
        hexCode: editingOptionHexCode ? editingOptionHexCode : updated[index].values[idx]?.hexCode,
      })),
    };

    setOptions(updated);
    setSelectedOptionValues(prev => ({ ...prev, [updated[index].name]: values }));

    updateProductMutation.mutate({ options: updated });
    setEditingOptionIndex(null);
    setEditOptionValues('');
    setEditingOptionHexCode('');
  };

  const handleDeleteOption = (index: number) => {
    const opt = options[index];
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);

    const newSelected = { ...selectedOptionValues };
    delete newSelected[opt.name];
    setSelectedOptionValues(newSelected);

    updateProductMutation.mutate({ options: updated });
  };

  const handleToggleOptionValue = (optionName: string, value: string) => {
    setSelectedOptionValues(prev => {
      const current = prev[optionName] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [optionName]: updated };
    });
  };

  const generateCombinations = (): any[] => {
    const optionNames = Object.keys(selectedOptionValues).filter(
      name => selectedOptionValues[name] && selectedOptionValues[name].length > 0
    );

    if (optionNames.length === 0) {
      return [];
    }

    const combinations: Record<string, string>[] = [];

    const generate = (index: number, current: Record<string, string>) => {
      if (index === optionNames.length) {
        combinations.push({ ...current });
        return;
      }
      const name = optionNames[index];
      for (const value of selectedOptionValues[name]) {
        current[name] = value;
        generate(index + 1, current);
      }
    };

    generate(0, {});

    return combinations.map(combo => {
      const name = Object.values(combo).join(' - ');

      return {
        productId,
        name,
        sku: '',
        price: bulkPrice.price || product?.price || 0,
        sellingPrice: bulkPrice.sellingPrice || product?.sellingPrice || 0,
        mrp: bulkPrice.mrp || product?.mrp || 0,
        weight: 0,
        weightUnit: '',
        packQuantity: 1,
        isActive: true,
        expiresAt: '',
        options: Object.entries(combo).map(([optionName, optionValue]) => ({
          optionName,
          optionValue,
        })),
      };
    });
  };

  const handleGenerateVariants = () => {
    const variants = generateCombinations();
    if (variants.length === 0) return;

    if (variants.length > 50) {
      toast.error(`Too many variants (${variants.length}). Maximum 50 allowed.`);
      return;
    }

    bulkCreateMutation.mutate(variants);
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
      weight: variant.weight || 0,
      weightUnit: variant.weightUnit || "",
      packQuantity: variant.packQuantity || 1,
      isActive: variant.isActive,
      expiresAt: variant.expiresAt || "",
      options: variant.options || [],
    });
    setShowForm(true);
  };

  const getOptionDisplay = (variantOptions?: ProductVariantOption[]) => {
    if (!variantOptions) return null;
    return variantOptions.map(opt => (
      <span key={opt.optionName} className="inline-flex items-center bg-gray-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">
        {opt.optionName}: {opt.optionValue}
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Manage Variants</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Variants ({variants.length})
              </button>
              <button
                onClick={() => setView('options')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'options' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Options
              </button>
              <button
                onClick={() => setView('generate')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'generate' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Generate
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {view === 'list' && (
            <div className="space-y-4">
              {variants.length === 0 && !showForm ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-800 mb-2">No Variants Yet</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      {options.length > 0 
                        ? "You have defined options. Go to 'Generate' tab to create variants from your options."
                        : "To create variants, first define options in the 'Options' tab, then generate variants."}
                    </p>
                    {options.length === 0 && (
                      <button
                        onClick={() => setView('options')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Define Options First
                      </button>
                    )}
                    {options.length > 0 && (
                      <button
                        onClick={() => setView('generate')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Generate Variants
                      </button>
                    )}
                  </div>
                  <p className="text-gray-500 mb-4">or add a variant manually:</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Add Variant Manually
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showForm && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          resetForm();
                          setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        <Plus className="w-5 h-5" />
                        Add Variant
                      </button>
                      {options.length > 0 && (
                        <button
                          onClick={() => setView('generate')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Layers className="w-5 h-5" />
                          Generate More Variants
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {variants.map((variant) => {
                      const stock = inventoryStock[variant.id!] ?? 0;
                      const isEditingStock = editingInventoryId === variant.id;
                      
                      return (
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
                                {getOptionDisplay(variant.options)}
                                {variant.packQuantity > 1 && (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                                    Pack: {variant.packQuantity} pcs
                                  </span>
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
                                {variant.expiresAt && (
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                    Exp: {new Date(variant.expiresAt).toLocaleDateString('en-IN')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-600">Stock:</span>
                                {isEditingStock ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={stock}
                                      onChange={(e) => {
                                        const newStock: Record<string, number> = {};
                                        newStock[variant.id!] = parseInt(e.target.value) || 0;
                                        setInventoryStock(prev => ({ ...prev, [variant.id!]: parseInt(e.target.value) || 0 }));
                                      }}
                                      className="w-20 px-2 py-1 border rounded text-sm"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => variant.id && updateInventoryMutation.mutate({ variantId: variant.id, quantity: inventoryStock[variant.id!] || 0 })}
                                      disabled={updateInventoryMutation.isPending}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingInventoryId(null)}
                                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className={`text-sm font-medium ${
                                      stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                      {stock} units
                                    </span>
                                    <button
                                      onClick={() => setEditingInventoryId(variant.id!)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Edit stock"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  </>
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
                      );
                    })}
                  </div>
                </div>
              )}
              
              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
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
                        placeholder="e.g., Red - Large"
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
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  {options.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {options.map((opt) => (
                          <div key={opt.name}>
                            <label className="block text-xs text-gray-500 mb-1">
                              {opt.name}
                            </label>
                            <select
                              value={formData.options?.find(o => o.optionName === opt.name)?.optionValue || ""}
                              onChange={(e) => {
                                const newOptions = formData.options?.filter(o => o.optionName !== opt.name) || [];
                                if (e.target.value) {
                                  const selectedValue = opt.values.find(v => v.value === e.target.value);
                                  newOptions.push({
                                    optionId: opt.id!,
                                    optionName: opt.name,
                                    optionValueId: selectedValue?.id || 0,
                                    optionValue: e.target.value,
                                  });
                                }
                                setFormData({ ...formData, options: newOptions });
                              }}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                              <option value="">Select {opt.name}</option>
                              {opt.values.map((val) => (
                                <option key={val.id || val.value} value={val.value}>{val.value}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    <div className="flex items-end">
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
          )}

          {view === 'options' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Product Options</h3>
                <p className="text-sm text-blue-700">
                  Define options like Color, Size, Material, etc. Each option can have multiple values
                  that will be combined to generate variants.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option Name
                  </label>
                  <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="e.g., Color, Size, Material"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Values (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newOptionValues}
                    onChange={(e) => setNewOptionValues(e.target.value)}
                    placeholder="e.g., Red, Blue, Green"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={handleAddOption}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                Add Option
              </button>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Values</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {options.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No options defined. Add your first option above.
                        </td>
                      </tr>
                    ) : (
                      options.map((opt, index) => (
                        <tr key={opt.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {opt.name}
                          </td>
                          <td className="px-4 py-3">
                            {editingOptionIndex === index ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editOptionValues}
                                  onChange={(e) => setEditOptionValues(e.target.value)}
                                  placeholder="Comma-separated values"
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                                <input
                                  type="text"
                                  value={editingOptionHexCode}
                                  onChange={(e) => setEditingOptionHexCode(e.target.value)}
                                  placeholder="Hex code for color (e.g. #FF0000)"
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateOption(index)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingOptionIndex(null);
                                      setEditOptionValues('');
                                      setEditingOptionHexCode('');
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {opt.values.map((val) => (
                                  <span
                                    key={val.id || val.value}
                                    className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                                  >
                                    {val.hexCode && (
                                      <span
                                        className="w-3 h-3 rounded-full mr-1"
                                        style={{ backgroundColor: val.hexCode }}
                                      />
                                    )}
                                    {val.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingOptionIndex(index);
                                  setEditOptionValues(opt.values.map(v => v.value).join(', '));
                                  setEditingOptionHexCode(opt.values[0]?.hexCode || '');
                                }}
                                className="p-1 text-gray-400 hover:text-primary-600"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOption(index)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'generate' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">Generate Variants</h3>
                <p className="text-sm text-purple-700">
                  Select values for each option to generate all possible variant combinations.
                  {options.length > 0 && (
                    <> You have {options.length} option(s) defined.</>
                  )}
                </p>
              </div>

              {options.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No options defined yet.</p>
                  <button
                    onClick={() => setView('options')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Define Options First
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {options.map((opt) => (
                      <div key={opt.name} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          {opt.name}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map((val) => {
                            const isSelected = selectedOptionValues[opt.name]?.includes(val.value);
                            return (
                              <button
                                key={val.id || val.value}
                                onClick={() => handleToggleOptionValue(opt.name, val.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {val.hexCode && (
                                  <span
                                    className="inline-block w-3 h-3 rounded-full mr-1"
                                    style={{ backgroundColor: val.hexCode }}
                                  />
                                )}
                                {val.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Bulk Pricing</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={bulkPrice.price || ''}
                          onChange={(e) => setBulkPrice({ ...bulkPrice, price: Number(e.target.value) })}
                          placeholder={String(product?.price || 0)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Selling Price (₹)</label>
                        <input
                          type="number"
                          value={bulkPrice.sellingPrice || ''}
                          onChange={(e) => setBulkPrice({ ...bulkPrice, sellingPrice: Number(e.target.value) })}
                          placeholder={String(product?.sellingPrice || 0)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">MRP (₹)</label>
                        <input
                          type="number"
                          value={bulkPrice.mrp || ''}
                          onChange={(e) => setBulkPrice({ ...bulkPrice, mrp: Number(e.target.value) })}
                          placeholder={String(product?.mrp || 0)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Leave empty to use product's default prices.
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {(() => {
                          const optionNames = Object.keys(selectedOptionValues).filter(
                            name => selectedOptionValues[name]?.length > 0
                          );
                          if (optionNames.length === 0) return 0;
                          return optionNames.reduce(
                            (acc, name) => acc * (selectedOptionValues[name]?.length || 0),
                            1
                          );
                        })()}
                      </div>
                      <p className="text-sm text-gray-500">variants will be created</p>
                    </div>
                    <button
                      onClick={handleGenerateVariants}
                      disabled={bulkCreateMutation.isPending}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {bulkCreateMutation.isPending ? 'Generating...' : 'Generate Variants'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
