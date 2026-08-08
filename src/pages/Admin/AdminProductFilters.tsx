import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { formatPrice } from "@/utils/format";
import {
  ProductFormModal,
  DeleteProductModal,
} from "@/components/admin/ProductModal";
import {
  Search,
  Filter,
  X,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  SlidersHorizontal,
  Tag,
  Layers,
  Store,
  BadgeCheck,
  Clock,
  Copy,
  PackageX,
  Edit,
  Trash2,
} from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

const MISSING_OPTIONS = [
  { key: "images", label: "No Images" },
  { key: "description", label: "No Description" },
  { key: "shortDescription", label: "No Short Description" },
  { key: "category", label: "No Category" },
  { key: "brand", label: "No Brand" },
  { key: "department", label: "No Department" },
  { key: "sku", label: "No SKU" },
  { key: "price", label: "No Price" },
  { key: "features", label: "No Features" },
  { key: "keySpecifications", label: "No Key Specs" },
  { key: "packaging", label: "No Packaging" },
  { key: "directionToUse", label: "No Directions to Use" },
  { key: "additionalInfo", label: "No Additional Info" },
  { key: "warranty", label: "No Warranty" },
  { key: "variants", label: "No Variants (flagged)" },
];

const DUPLICATE_OPTIONS = [
  { key: "name", label: "Same Name" },
  { key: "sku", label: "Same SKU" },
  { key: "name-brand", label: "Same Name + Brand" },
];

const EMPTY_FILTERS = {
  brandIds: [] as number[],
  categoryId: "",
  departmentIds: [] as number[],
  isActive: "",
  isFeatured: false,
  hasVariants: false,
  minPrice: "",
  maxPrice: "",
  stockStatus: "",
  missing: [] as string[],
  duplicate: "",
  expired: false,
  expiringSoon: false,
  expiringDays: 30,
};

type Filters = typeof EMPTY_FILTERS;

const toParams = (filters: Filters, page: number, limit: number, search: string) => {
  const params: Record<string, string | number | boolean> = { page, limit };
  if (search) params.search = search;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.brandIds.length > 0) params.brandId = filters.brandIds[0];
  if (filters.departmentIds.length > 0) {
    params.departmentIds = filters.departmentIds.join(",");
  }
  if (filters.isActive !== "") params.isActive = filters.isActive;
  if (filters.isFeatured) params.isFeatured = true;
  if (filters.hasVariants) params.hasVariants = true;
  if (filters.minPrice) params.minPrice = Number(filters.minPrice);
  if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
  if (filters.stockStatus) params.stockStatus = filters.stockStatus;
  if (filters.missing.length > 0) params.missing = filters.missing.join(",");
  if (filters.duplicate) params.duplicate = filters.duplicate;
  if (filters.expired) params.expired = true;
  if (filters.expiringSoon) {
    params.expiringSoon = true;
    params.expiringDays = filters.expiringDays;
  }
  return params;
};

/* ------------------- shared UI helpers ------------------- */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-3 py-1"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
          checked
            ? "bg-gradient-to-r from-primary-500 to-blue-600"
            : "bg-gray-200 group-hover:bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span
        className={`text-sm transition-colors ${
          checked ? "text-gray-900 font-medium" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
  tone = "primary",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "primary" | "amber";
}) {
  const activeStyles =
    tone === "amber"
      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md shadow-amber-500/25"
      : "bg-gradient-to-r from-primary-500 to-blue-600 text-white border-transparent shadow-md shadow-primary-500/25";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all duration-200 active:scale-95 ${
        active
          ? activeStyles
          : "bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50"
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </span>
      <span className="text-sm font-semibold text-gray-900">{title}</span>
      {count !== undefined && count > 0 && (
        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-[11px] font-bold">
          {count}
        </span>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full pl-3 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${prefix ? "pl-7" : "pl-3"} pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all`}
        />
      </div>
    </div>
  );
}

function OptionPillList({
  items,
  selected,
  onChange,
}: {
  items: any[];
  selected: number[];
  onChange: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const sorted = [...filtered].sort(
    (a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)),
  );

  const showEverything = !!query.trim() || showAll;
  const visible = showEverything ? sorted : sorted.slice(0, 8);
  const hidden = sorted.length - visible.length;

  if (items.length === 0) {
    return <p className="text-xs text-gray-400 py-2">No options available</p>;
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {visible.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {visible.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? "bg-gradient-to-r from-primary-500 to-blue-600 text-white border-transparent shadow-md shadow-primary-500/25"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                  {item.name}
                </button>
              );
            })}
          </div>
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-2.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              +{hidden} more
            </button>
          )}
          {showAll && !query.trim() && sorted.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="mt-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Show less
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 py-2">No matches found</p>
      )}
    </div>
  );
}

function getPageNumbers(totalPages: number, current: number): (number | string)[] {
  const delta = 2;
  const range: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - current) <= delta) {
      range.push(i);
    } else if (range[range.length - 1] !== "…") {
      range.push("…");
    }
  }
  return range;
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}: {
  product: any;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={selected ? "Deselect product" : "Select product"}
          className="absolute top-2.5 left-2.5 z-10 h-5 w-5 rounded border-gray-300 accent-red-600 shadow-md cursor-pointer"
        />
        <img
          src={product.images?.[0] || DEFAULT_IMAGE}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
          }}
        />
        {!product.isActive && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md shadow-red-500/30">
            Inactive
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute top-2.5 left-11 bg-gradient-to-r from-primary-500 to-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md shadow-primary-500/30">
            Featured
          </span>
        )}
        {!product.images?.length && (
          <span className="absolute bottom-2.5 left-2.5 bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md shadow-amber-500/30">
            No Images
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {product.category?.name || "Uncategorized"}
        </p>
        <div className="flex items-end justify-between mt-3 gap-2">
          {product.hasVariants ? (
            <div>
              <p className="text-xs text-gray-500">
                {product.variantCount} variant{product.variantCount !== 1 ? "s" : ""}
              </p>
              {product.variantPriceRange && (
                <p className="text-base font-bold text-primary-600">
                  {product.variantPriceRange}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold text-primary-600">
                ₹{formatPrice(product.sellingPrice || 0)}
              </p>
              {product.mrp > product.sellingPrice && (
                <p className="text-xs text-gray-400 line-through">
                  ₹{formatPrice(product.mrp)}
                </p>
              )}
            </div>
          )}
          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
              product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.stock > 0 ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

/* ------------------- page ------------------- */

export default function AdminProductFilters() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    product: any;
  }>({ show: false, product: null });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const refreshResults = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-product-filters"] });
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const confirmDelete = (product: any) => {
    setDeleteModal({ show: true, product });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroupSelect = (group: any[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const keys = group.map((p: any) => String(p.id));
      const allSelected = keys.every((k) => next.has(k));
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      api.post("/admin/products/bulk-delete", { ids }),
    onSuccess: (res) => {
      const deleted = (res?.data as any)?.deleted ?? selectedIds.size;
      toast.success(`${deleted} product${deleted !== 1 ? "s" : ""} deleted`);
      setSelectedIds(new Set());
      setBulkDeleteModal(false);
      refreshResults();
    },
    onError: () => toast.error("Failed to delete products"),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, appliedFilters, debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-product-filters", page, debouncedSearch, appliedFilters],
    queryFn: () =>
      api.get("/admin/products", {
        params: toParams(
          appliedFilters || EMPTY_FILTERS,
          page,
          12,
          debouncedSearch,
        ),
      }),
    enabled: user?.role === "admin",
    placeholderData: (prevData) => prevData,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/admin/categories"),
    enabled: user?.role === "admin",
  });

  const { data: brandsData } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => api.get("/brands/admin/all"),
    enabled: user?.role === "admin",
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: () => api.get("/departments?active=false"),
    enabled: user?.role === "admin",
  });

  const categories = (categoriesData?.data as any)?.categories || [];
  const brands = Array.isArray(brandsData?.data) ? brandsData.data : [];
  const departments = Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : [];

  const products = (data?.data as any)?.products || [];
  const totalPages = (data?.data as any)?.totalPages || 1;
  const total = (data?.data as any)?.total || 0;

  const groupedProducts = useMemo(() => {
    if (!appliedFilters?.duplicate) return null;
    const groups = new Map<string, any[]>();
    products.forEach((p: any) => {
      const key = p.duplicateGroupKey ?? String(p.id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return Array.from(groups.values()).sort((a, b) => b.length - a.length);
  }, [products, appliedFilters]);

  const visibleProducts = groupedProducts
    ? groupedProducts.flat()
    : products;

  const toggleSelectAll = () => {
    if (visibleProducts.length === 0) return;
    const allSelected = visibleProducts.every((p: any) =>
      selectedIds.has(String(p.id)),
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleProducts.forEach((p: any) => {
        const key = String(p.id);
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const toggleBrand = (id: number) => {
    setFilters((f) => ({
      ...f,
      brandIds: f.brandIds.includes(id)
        ? f.brandIds.filter((b) => b !== id)
        : [...f.brandIds, id],
    }));
  };

  const toggleDepartment = (id: number) => {
    setFilters((f) => ({
      ...f,
      departmentIds: f.departmentIds.includes(id)
        ? f.departmentIds.filter((d) => d !== id)
        : [...f.departmentIds, id],
    }));
  };

  const toggleMissing = (key: string) => {
    setFilters((f) => ({
      ...f,
      missing: f.missing.includes(key)
        ? f.missing.filter((m) => m !== key)
        : [...f.missing, key],
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters(null);
    setPage(1);
  };

  const patchApplied = (patch: Partial<Filters>) => {
    if (!appliedFilters) return;
    const next = { ...appliedFilters, ...patch };
    setFilters(next);
    setAppliedFilters(next);
    setPage(1);
  };

  const appliedChips = useMemo(() => {
    if (!appliedFilters) return [];
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    appliedFilters.brandIds.forEach((id) => {
      const b = brands.find((x: any) => x.id === id);
      if (b)
        chips.push({
          key: `brand-${id}`,
          label: `Brand: ${b.name}`,
          onRemove: () =>
            patchApplied({
              brandIds: appliedFilters!.brandIds.filter((x) => x !== id),
            }),
        });
    });
    if (appliedFilters.categoryId) {
      const c = categories.find(
        (x: any) => String(x.id) === String(appliedFilters.categoryId),
      );
      chips.push({
        key: "category",
        label: `Category: ${c?.name || ""}`,
        onRemove: () => patchApplied({ categoryId: "" }),
      });
    }
    appliedFilters.departmentIds.forEach((id) => {
      const d = departments.find((x: any) => x.id === id);
      if (d)
        chips.push({
          key: `dept-${id}`,
          label: `Department: ${d.name}`,
          onRemove: () =>
            patchApplied({
              departmentIds: appliedFilters!.departmentIds.filter((x) => x !== id),
            }),
        });
    });
    if (appliedFilters.isActive !== "")
      chips.push({
        key: "status",
        label: appliedFilters.isActive === "true" ? "Active" : "Inactive",
        onRemove: () => patchApplied({ isActive: "" }),
      });
    if (appliedFilters.isFeatured)
      chips.push({
        key: "featured",
        label: "Featured",
        onRemove: () => patchApplied({ isFeatured: false }),
      });
    if (appliedFilters.hasVariants)
      chips.push({
        key: "variants",
        label: "Has variants",
        onRemove: () => patchApplied({ hasVariants: false }),
      });
    if (appliedFilters.minPrice)
      chips.push({
        key: "min-price",
        label: `Min ₹${formatPrice(Number(appliedFilters.minPrice))}`,
        onRemove: () => patchApplied({ minPrice: "" }),
      });
    if (appliedFilters.maxPrice)
      chips.push({
        key: "max-price",
        label: `Max ₹${formatPrice(Number(appliedFilters.maxPrice))}`,
        onRemove: () => patchApplied({ maxPrice: "" }),
      });
    if (appliedFilters.stockStatus) {
      const stockLabel =
        ({ in: "In Stock", low: "Low Stock", out: "Out of Stock" } as Record<
          string,
          string
        >)[appliedFilters.stockStatus] || appliedFilters.stockStatus;
      chips.push({
        key: "stock",
        label: `Stock: ${stockLabel}`,
        onRemove: () => patchApplied({ stockStatus: "" }),
      });
    }
    appliedFilters.missing.forEach((m) => {
      const label = MISSING_OPTIONS.find((o) => o.key === m)?.label;
      if (label)
        chips.push({
          key: `missing-${m}`,
          label,
          onRemove: () =>
            patchApplied({
              missing: appliedFilters!.missing.filter((x) => x !== m),
            }),
        });
    });
    if (appliedFilters.duplicate) {
      const label = DUPLICATE_OPTIONS.find(
        (o) => o.key === appliedFilters.duplicate,
      )?.label;
      chips.push({
        key: "duplicate",
        label: `Duplicates: ${label || ""}`,
        onRemove: () => patchApplied({ duplicate: "" }),
      });
    }
    if (appliedFilters.expired)
      chips.push({
        key: "expired",
        label: "Expired",
        onRemove: () => patchApplied({ expired: false }),
      });
    if (appliedFilters.expiringSoon)
      chips.push({
        key: "expiring",
        label: `Expiring soon (${appliedFilters.expiringDays}d)`,
        onRemove: () => patchApplied({ expiringSoon: false }),
      });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, brands, categories, departments]);

  const draftCount =
    filters.brandIds.length +
    (filters.categoryId ? 1 : 0) +
    filters.departmentIds.length +
    (filters.isActive !== "" ? 1 : 0) +
    (filters.isFeatured ? 1 : 0) +
    (filters.hasVariants ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.stockStatus ? 1 : 0) +
    filters.missing.length +
    (filters.duplicate ? 1 : 0) +
    (filters.expired ? 1 : 0) +
    (filters.expiringSoon ? 1 : 0);

  if (isLoading && !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gray-200 rounded-2xl"></div>
          <div className="space-y-2">
            <div className="h-6 w-64 bg-gray-200 rounded"></div>
            <div className="h-4 w-80 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-16 bg-gray-100 rounded-xl"></div>
        <div className="h-72 bg-gray-100 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-100"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-5 bg-gray-100 rounded w-1/3 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 text-white shadow-lg shadow-primary-500/25">
            <SlidersHorizontal className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Advanced Product Filters
            </h1>
            <p className="text-gray-500">
              Filter products by missing fields, duplicates and more
            </p>
          </div>
        </div>
        <button
          onClick={resetFilters}
          disabled={!appliedFilters}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 text-white shadow-md shadow-primary-500/25">
              <Filter className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900 leading-tight">
                Filter criteria
              </h2>
              <p className="text-xs text-gray-400">
                Build a query to narrow down products
              </p>
            </div>
          </div>
          {draftCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {draftCount} criterion{draftCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="p-6 space-y-8">
          {/* Basics */}
          <section>
            <SectionHeader icon={<Tag className="h-4 w-4" />} title="Product basics" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <SelectField
                label="Category"
                value={filters.categoryId}
                onChange={(e) =>
                  setFilters({ ...filters, categoryId: e.target.value })
                }
              >
                <option value="">All categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </SelectField>
              <NumberField
                label="Min Price"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
                placeholder="0"
                prefix="₹"
              />
              <NumberField
                label="Max Price"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
                placeholder="0"
                prefix="₹"
              />
              <SelectField
                label="Stock Status"
                value={filters.stockStatus}
                onChange={(e) =>
                  setFilters({ ...filters, stockStatus: e.target.value })
                }
              >
                <option value="">Any stock</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </SelectField>
            </div>
          </section>

          {/* Brand & Department */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <SectionHeader
                icon={<Store className="h-4 w-4" />}
                title="Brands"
                count={filters.brandIds.length}
              />
              <OptionPillList
                items={brands}
                selected={filters.brandIds}
                onChange={toggleBrand}
              />
            </div>
            <div>
              <SectionHeader
                icon={<Layers className="h-4 w-4" />}
                title="Departments"
                count={filters.departmentIds.length}
              />
              <OptionPillList
                items={departments}
                selected={filters.departmentIds}
                onChange={toggleDepartment}
              />
            </div>
          </section>

          {/* Flags */}
          <section>
            <SectionHeader icon={<BadgeCheck className="h-4 w-4" />} title="Status & flags" />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Toggle
                label="Featured"
                checked={filters.isFeatured}
                onChange={(v) => setFilters({ ...filters, isFeatured: v })}
              />
              <Toggle
                label="Has variants"
                checked={filters.hasVariants}
                onChange={(v) => setFilters({ ...filters, hasVariants: v })}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 mr-1">
                  Status:
                </span>
                {[
                  { v: "", l: "Any" },
                  { v: "true", l: "Active" },
                  { v: "false", l: "Inactive" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setFilters({ ...filters, isActive: opt.v })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      filters.isActive === opt.v
                        ? "bg-gray-900 text-white border-gray-900 shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Quality checks */}
          <section>
            <SectionHeader
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Quality checks (missing / incomplete)"
              count={filters.missing.length}
            />
            <div className="flex flex-wrap gap-2">
              {MISSING_OPTIONS.map((opt) => (
                <Pill
                  key={opt.key}
                  active={filters.missing.includes(opt.key)}
                  onClick={() => toggleMissing(opt.key)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </section>

          {/* Expiry */}
          <section>
            <SectionHeader icon={<Clock className="h-4 w-4" />} title="Expiry" />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Toggle
                label="Expired"
                checked={filters.expired}
                onChange={(v) => setFilters({ ...filters, expired: v })}
              />
              <Toggle
                label="Expiring soon"
                checked={filters.expiringSoon}
                onChange={(v) => setFilters({ ...filters, expiringSoon: v })}
              />
              {filters.expiringSoon && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                  <span className="text-sm text-gray-500">within</span>
                  <input
                    type="number"
                    min={1}
                    value={filters.expiringDays}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        expiringDays: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-16 px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              )}
            </div>
          </section>

          {/* Duplicates */}
          <section>
            <SectionHeader
              icon={<Copy className="h-4 w-4" />}
              title="Duplicate products"
              count={filters.duplicate ? 1 : 0}
            />
            <div className="flex flex-wrap gap-2">
              {DUPLICATE_OPTIONS.map((opt) => (
                <Pill
                  key={opt.key}
                  tone="amber"
                  active={filters.duplicate === opt.key}
                  onClick={() => setFilters({ ...filters, duplicate: opt.key })}
                >
                  {opt.label}
                </Pill>
              ))}
              {filters.duplicate && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, duplicate: "" })}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500">
            {draftCount > 0 ? (
              <>
                <span className="font-semibold text-gray-900">{draftCount}</span>{" "}
                active filter{draftCount > 1 ? "s" : ""} ready to apply
              </>
            ) : (
              "No filters selected yet"
            )}
          </p>
          <button
            onClick={applyFilters}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-xl font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] transition-all"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Applied filter chips */}
      {appliedFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              {total} product{total !== 1 ? "s" : ""} found
            </span>
            {appliedChips.map((chip) => (
              <span
                key={chip.key}
                className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                  title={`Remove ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {appliedChips.length > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-full transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          {appliedFilters.duplicate && (
            <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1.5">
              <Copy className="w-3 h-3 text-amber-500" />
              Results grouped by{" "}
              {DUPLICATE_OPTIONS.find((o) => o.key === appliedFilters.duplicate)
                ?.label.toLowerCase()}
            </p>
          )}
        </div>
      )}

      {/* Selection toolbar */}
      {visibleProducts.length > 0 && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
            selectedIds.size > 0
              ? "bg-red-50 border-red-200"
              : "bg-white border-gray-200"
          }`}
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={
                visibleProducts.length > 0 &&
                selectedIds.size === visibleProducts.length
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 accent-red-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Select all ({visibleProducts.length})
            </span>
            {selectedIds.size > 0 && (
              <span className="text-sm font-semibold text-red-700">
                {selectedIds.size} selected
              </span>
            )}
          </label>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 active:scale-[0.98] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {groupedProducts ? (
        <div className="space-y-8">
          {groupedProducts.map((group, idx) => {
            const groupKeys = group.map((p: any) => String(p.id));
            const groupSelected = groupKeys.every((k) => selectedIds.has(k));
            return (
              <div key={idx}>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={groupSelected}
                    onChange={() => toggleGroupSelect(group)}
                    aria-label="Select all copies"
                    className="h-4 w-4 rounded border-gray-300 accent-red-600 cursor-pointer"
                  />
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {group[0].name}
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold">
                    {group.length} copies
                  </span>
                  {groupSelected && (
                    <span className="text-xs font-semibold text-red-600">
                      selected
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={openEdit}
                      onDelete={confirmDelete}
                      selected={selectedIds.has(String(product.id))}
                      onToggleSelect={() => toggleSelect(product.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {groupedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <Copy className="w-8 h-8" />
              </span>
              <p className="mt-4 text-gray-500 font-medium">
                No duplicate products found
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEdit}
              onDelete={confirmDelete}
              selected={selectedIds.has(String(product.id))}
              onToggleSelect={() => toggleSelect(product.id)}
            />
          ))}
          {products.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <PackageX className="w-8 h-8" />
              </span>
              <p className="mt-4 text-gray-500 font-medium">
                {appliedFilters
                  ? "No products match the selected filters"
                  : "Apply filters to see results"}
              </p>
              {appliedFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!groupedProducts && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers(totalPages, page).map((pg, i) =>
            pg === "…" ? (
              <span key={`e-${i}`} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={pg}
                onClick={() => setPage(pg as number)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                  page === pg
                    ? "bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-md shadow-primary-500/25"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {pg}
              </button>
            ),
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <ProductFormModal
        open={showModal}
        product={editingProduct}
        onClose={closeModal}
        onSaved={refreshResults}
      />

      <DeleteProductModal
        open={deleteModal.show}
        product={deleteModal.product}
        onClose={() => setDeleteModal({ show: false, product: null })}
        onDeleted={refreshResults}
      />

      {bulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete {selectedIds.size} product
                    {selectedIds.size !== 1 ? "s" : ""}
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete all selected products? This
                will permanently remove them from your store.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {products
                  .filter((p: any) => selectedIds.has(String(p.id)))
                  .slice(0, 5)
                  .map((p: any) => (
                    <span
                      key={p.id}
                      className="text-[11px] px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {p.name}
                    </span>
                  ))}
                {selectedIds.size > 5 && (
                  <span className="text-[11px] px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                    +{selectedIds.size - 5} more
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBulkDeleteModal(false)}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    bulkDeleteMutation.mutate(
                      Array.from(selectedIds).map(Number),
                    )
                  }
                  disabled={bulkDeleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {bulkDeleteMutation.isPending
                    ? "Deleting..."
                    : `Delete ${selectedIds.size} product${selectedIds.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
