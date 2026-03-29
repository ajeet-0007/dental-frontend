import { useState, useEffect, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { Package, ChevronDown, ChevronUp, X, SlidersHorizontal, ShoppingCart, Check, Heart, ArrowUpDown } from "lucide-react";
import CartDrawer from "@/components/common/CartDrawer";
import { PriceRangeSlider } from "@/components/common/PriceRangeSlider";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop";

interface Filters {
  categories: string[];
  departments: string[];
  brands: string[];
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

interface ExpandedSections {
  categories: boolean;
  departments: boolean;
  brands: boolean;
  price: boolean;
  availability: boolean;
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    categories: true,
    departments: true,
    brands: true,
    price: true,
    availability: true,
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    categories: [],
    departments: [],
    brands: [],
    minPrice: "",
    maxPrice: "",
    inStock: false,
  });

  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
  ];

  const { items } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  const searchQuery = searchParams.get("search");

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    },
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/brands");
      return response.data;
    },
  });

  const categories = categoriesData?.data || [];
  const departments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];
  const brands = Array.isArray(brandsData) ? brandsData : brandsData?.data || [];

  useEffect(() => {
    const urlCategories = searchParams.get("category");
    const urlDepartments = searchParams.get("department");
    const urlBrands = searchParams.get("brand");
    const urlMinPrice = searchParams.get("minPrice");
    const urlMaxPrice = searchParams.get("maxPrice");
    const urlInStock = searchParams.get("inStock");

    setFilters(() => ({
      categories: urlCategories ? urlCategories.split(",").filter(Boolean) : [],
      departments: urlDepartments ? urlDepartments.split(",").filter(Boolean) : [],
      brands: urlBrands ? urlBrands.split(",").filter(Boolean) : [],
      minPrice: urlMinPrice || "",
      maxPrice: urlMaxPrice || "",
      inStock: urlInStock === "true",
    }));
    setPage(1);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", searchQuery, filters, page, sortBy],
    queryFn: () =>
      api.get("/products", {
        params: {
          search: searchQuery || undefined,
          categories: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
          departments: filters.departments.length > 0 ? filters.departments.join(',') : undefined,
          brand: filters.brands.length > 0 ? filters.brands.join(',') : undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          inStock: filters.inStock || undefined,
          page,
          limit: 12,
          sortBy,
        },
      }),
  });

  const products = data?.data?.products || [];
  const totalPages = data?.data?.totalPages || 0;

  const updateURLParams = (newFilters: Filters) => {
    const params = new URLSearchParams();
    
    if (newFilters.categories.length > 0) {
      params.set("category", newFilters.categories.join(","));
    }
    if (newFilters.departments.length > 0) {
      params.set("department", newFilters.departments.join(","));
    }
    if (newFilters.brands.length > 0) {
      params.set("brand", newFilters.brands.join(","));
    }
    if (newFilters.minPrice) {
      params.set("minPrice", newFilters.minPrice);
    }
    if (newFilters.maxPrice) {
      params.set("maxPrice", newFilters.maxPrice);
    }
    if (newFilters.inStock) {
      params.set("inStock", "true");
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    
    setSearchParams(params, { replace: true });
  };

  const toggleCategory = (slug: string) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        categories: prev.categories.includes(slug)
          ? prev.categories.filter((c) => c !== slug)
          : [...prev.categories, slug],
      };
      updateURLParams(newFilters);
      return newFilters;
    });
    setPage(1);
  };

  const toggleDepartment = (slug: string) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        departments: prev.departments.includes(slug)
          ? prev.departments.filter((d) => d !== slug)
          : [...prev.departments, slug],
      };
      updateURLParams(newFilters);
      return newFilters;
    });
    setPage(1);
  };

  const toggleBrand = (slug: string) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        brands: prev.brands.includes(slug)
          ? prev.brands.filter((b) => b !== slug)
          : [...prev.brands, slug],
      };
      updateURLParams(newFilters);
      return newFilters;
    });
    setPage(1);
  };

  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.departments.length > 0 ||
    filters.brands.length > 0 ||
    !!filters.minPrice || 
    !!filters.maxPrice || 
    filters.inStock;

  const handleOpenCartDrawer = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setIsCartDrawerOpen(true);
  };

  const handleCloseCartDrawer = () => {
    setIsCartDrawerOpen(false);
    setSelectedProduct(null);
  };

  const clearFilters = () => {
    const emptyFilters: Filters = {
      categories: [],
      departments: [],
      brands: [],
      minPrice: "",
      maxPrice: "",
      inStock: false,
    };
    setFilters(emptyFilters);
    updateURLParams(emptyFilters);
  };

  const isInCart = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const handleToggleWishlist = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productId = product.id.toString();
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: productId,
        product: {
          id: productId,
          name: product.name,
          slug: product.slug,
          images: product.images,
          price: product.price,
          sellingPrice: product.sellingPrice,
          mrp: product.mrp,
          unit: product.unit || "unit",
        },
        addedAt: Date.now(),
      });
      toast.success("Added to wishlist");
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const FilterSidebar = memo(({
    filters,
    categories,
    departments,
    brands,
    expandedSections,
    hasActiveFilters,
    onToggleCategory,
    onToggleDepartment,
    onToggleBrand,
    onToggleSection,
    onClearFilters,
    onPriceChange,
    onInStockChange,
  }: {
    filters: Filters;
    categories: any[];
    departments: any[];
    brands: any[];
    expandedSections: ExpandedSections;
    hasActiveFilters: boolean;
    onToggleCategory: (slug: string) => void;
    onToggleDepartment: (slug: string) => void;
    onToggleBrand: (slug: string) => void;
    onToggleSection: (section: keyof ExpandedSections) => void;
    onClearFilters: () => void;
    onPriceChange: (min: number, max: number) => void;
    onInStockChange: (checked: boolean) => void;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-4 mb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-base text-gray-800">Filter</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories Section */}
      <div className="pb-4 border-b border-gray-100">
        <button
          onClick={() => onToggleSection("categories" as keyof ExpandedSections)}
          className="flex items-center justify-between w-full text-left py-2"
        >
          <span className="font-medium text-gray-800">Category</span>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="mt-2 space-y-1 max-h-72 overflow-y-auto pr-1">
            {categories.map((category: any) => (
              <label
                key={category.id}
                className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.slug)}
                  onChange={() => onToggleCategory(category.slug)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Departments Section */}
      {departments.length > 0 && (
        <div className="pb-4 border-b border-gray-100">
          <button
            onClick={() => onToggleSection("departments" as keyof ExpandedSections)}
            className="flex items-center justify-between w-full text-left py-2"
          >
            <span className="font-medium text-gray-800">Department</span>
            {expandedSections.departments ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {expandedSections.departments && (
            <div className="mt-2 space-y-1 max-h-72 overflow-y-auto pr-1">
              {departments.map((department: any) => (
                <label
                  key={department.id}
                  className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.departments.includes(department.slug)}
                    onChange={() => onToggleDepartment(department.slug)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    {department.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <div className="pb-4 border-b border-gray-100">
          <button
            onClick={() => onToggleSection("brands" as keyof ExpandedSections)}
            className="flex items-center justify-between w-full text-left py-2"
          >
            <span className="font-medium text-gray-800">Brand</span>
            {expandedSections.brands ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {expandedSections.brands && (
            <div className="mt-2 space-y-1 max-h-72 overflow-y-auto pr-1">
              {brands.map((brand: any) => (
                <label
                  key={brand.id}
                  className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand.slug)}
                    onChange={() => onToggleBrand(brand.slug)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    {brand.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Range Section */}
      <div className="pb-4 border-b border-gray-100">
        <button
          onClick={() => onToggleSection("price" as keyof ExpandedSections)}
          className="flex items-center justify-between w-full text-left py-2"
        >
          <span className="font-medium text-gray-800">Price</span>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.price && (
          <PriceRangeSlider
            min={0}
            max={100000}
            step={500}
            initialMin={filters.minPrice ? Number(filters.minPrice) : 0}
            initialMax={filters.maxPrice ? Number(filters.maxPrice) : 100000}
            onChange={onPriceChange}
          />
        )}
      </div>

      {/* Availability Section */}
      <div>
        <button
          onClick={() => onToggleSection("availability" as keyof ExpandedSections)}
          className="flex items-center justify-between w-full text-left py-2"
        >
          <span className="font-medium text-gray-800">Availability</span>
          {expandedSections.availability ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.availability && (
          <div className="mt-2">
            <label className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => onInStockChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
          </div>
        )}
      </div>
    </div>
  ));

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-gray-700 bg-gray-50 border rounded-lg"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
            {filters.categories.length + filters.departments.length + filters.brands.length + (filters.inStock ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0)}
          </span>
        )}
      </button>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-white border rounded-xl p-5 h-[calc(100vh-6rem)] overflow-y-auto">
            <FilterSidebar 
              filters={filters}
              categories={categories}
              departments={departments}
              brands={brands}
              expandedSections={expandedSections}
              hasActiveFilters={hasActiveFilters}
              onToggleCategory={toggleCategory}
              onToggleDepartment={toggleDepartment}
              onToggleBrand={toggleBrand}
              onToggleSection={(section) => toggleSection(section as keyof ExpandedSections)}
              onClearFilters={clearFilters}
              onPriceChange={(min, max) => {
                setFilters((prev) => {
                  const newFilters = {
                    ...prev,
                    minPrice: min.toString(),
                    maxPrice: max.toString(),
                  };
                  updateURLParams(newFilters);
                  return newFilters;
                });
                setPage(1);
              }}
              onInStockChange={(checked) => {
                setFilters((prev) => {
                  const newFilters = { ...prev, inStock: checked };
                  updateURLParams(newFilters);
                  return newFilters;
                });
                setPage(1);
              }}
            />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-gray-800">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <FilterSidebar 
                filters={filters}
                categories={categories}
                departments={departments}
                brands={brands}
                expandedSections={expandedSections}
                hasActiveFilters={hasActiveFilters}
                onToggleCategory={toggleCategory}
                onToggleDepartment={toggleDepartment}
                onToggleBrand={toggleBrand}
                onToggleSection={(section) => toggleSection(section as keyof ExpandedSections)}
                onClearFilters={clearFilters}
                onPriceChange={(min, max) => {
                  setFilters((prev) => {
                    const newFilters = {
                      ...prev,
                      minPrice: min.toString(),
                      maxPrice: max.toString(),
                    };
                    updateURLParams(newFilters);
                    return newFilters;
                  });
                  setPage(1);
                }}
                onInStockChange={(checked) => {
                  setFilters((prev) => {
                    const newFilters = { ...prev, inStock: checked };
                    updateURLParams(newFilters);
                    return newFilters;
                  });
                  setPage(1);
                }}
              />
              <button
                onClick={() => setShowFilters(false)}
                className="w-full mt-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                Show Results
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.categories.map((slug) => {
                const cat = categories.find((c: any) => c.slug === slug);
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-md"
                  >
                    {cat?.name}
                    <button
                      onClick={() => toggleCategory(slug)}
                      className="hover:text-primary-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              {filters.departments.map((slug) => {
                const dept = departments.find((d: any) => d.slug === slug);
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md"
                  >
                    {dept?.name}
                    <button
                      onClick={() => toggleDepartment(slug)}
                      className="hover:text-green-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              {filters.brands.map((slug) => {
                const brand = brands.find((b: any) => b.slug === slug);
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-md"
                  >
                    {brand?.name}
                    <button
                      onClick={() => toggleBrand(slug)}
                      className="hover:text-amber-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              {filters.minPrice && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-md">
                  Min: ₹{filters.minPrice}
                  <button onClick={() => {
                    setFilters((p) => {
                      const newFilters = { ...p, minPrice: "" };
                      updateURLParams(newFilters);
                      return newFilters;
                    });
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.maxPrice && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-md">
                  Max: ₹{filters.maxPrice}
                  <button onClick={() => {
                    setFilters((p) => {
                      const newFilters = { ...p, maxPrice: "" };
                      updateURLParams(newFilters);
                      return newFilters;
                    });
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.inStock && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-md">
                  In Stock
                  <button onClick={() => {
                    setFilters((p) => {
                      const newFilters = { ...p, inStock: false };
                      updateURLParams(newFilters);
                      return newFilters;
                    });
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Sort and Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {data?.data?.total || 0} products
            </p>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {sortOptions.find((o) => o.value === sortBy)?.label || "Sort"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-20 py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === option.value ? "text-primary-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white border rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-100"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-100 rounded w-1/3 mt-3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product: any) => {
                  const inCart = isInCart(product.id.toString());
                  const inWishlist = isInWishlist(product.id.toString());
                  const variants = product.variants || [];
                  const activeVariants = variants.filter((v: any) => v.isActive);
                  const hasVariants = activeVariants.length > 0;
                  
                  // Check stock availability from inventories
                  const inventories = product.inventories || [];
                  let totalStock = -1;
                  let hasAnyStock = false;
                  
                  if (inventories.length > 0) {
                    totalStock = inventories.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0);
                    hasAnyStock = inventories.some((inv: any) => (inv.quantity || 0) > 0);
                  }
                  
                  // For variant products, check if at least one variant has stock
                  // For non-variant products, check total stock
                  const isOutOfStock = hasVariants 
                    ? (inventories.length > 0 && !hasAnyStock)
                    : totalStock === 0;
                  
                  // Get price range from variants only (ignore product-level price for variant products)
                  let minPrice = product.sellingPrice;
                  let maxPrice = product.sellingPrice;
                  let showPriceRange = false;
                  
                  if (hasVariants) {
                    const variantPrices = activeVariants.map((v: any) => v.sellingPrice).filter((p: number) => p > 0);
                    if (variantPrices.length > 0) {
                      minPrice = Math.min(...variantPrices);
                      maxPrice = Math.max(...variantPrices);
                      showPriceRange = minPrice !== maxPrice;
                    } else {
                      minPrice = product.sellingPrice;
                      maxPrice = product.sellingPrice;
                    }
                  }
                  
                  // Get unique colors and sizes
                  const colors = [...new Set(activeVariants.filter((v: any) => v.color).map((v: any) => v.color as string))] as string[];
                  
                  return (
                    <div
                      key={product.id}
                      className={`relative bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
                        isOutOfStock ? 'opacity-60' : 'hover:shadow-lg'
                      }`}
                    >
                      <Link
                        to={`/products/${product.slug}`}
                        className="block"
                      >
                        <div className="aspect-square bg-gray-50 overflow-hidden relative">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={DEFAULT_IMAGE}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* Color swatches on image */}
                          {colors.length > 0 && (
                            <div className="absolute bottom-2 left-2 flex -space-x-1">
                              {colors.slice(0, 4).map((color: string, i: number) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[7px] font-bold text-gray-500 bg-gray-100"
                                  title={color}
                                >
                                  {color.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {colors.length > 4 && (
                                <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm bg-gray-200 text-[7px] font-bold flex items-center justify-center">
                                  +{colors.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                              {product.name}
                            </h3>
                            {/* Variant count badge */}
                            {hasVariants && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                                <Package className="w-3 h-3" />
                                {activeVariants.length} variant{activeVariants.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-primary-600">
                              {showPriceRange ? `From ₹${minPrice.toLocaleString()}` : `₹${minPrice.toLocaleString()}`}
                            </span>
                            {product.mrp > minPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{product.mrp.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => handleToggleWishlist(e, product)}
                        className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                          inWishlist
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-white/90 text-gray-600 hover:text-red-500 shadow-md"
                        }`}
                        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? "fill-white" : ""}`} />
                      </button>
                      
                      {/* Add to Cart Button - Fixed position */}
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gray-400 text-white cursor-not-allowed"
                          title="Out of Stock"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenCartDrawer(e, product)}
                          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 ${
                            inCart
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-primary-600 text-white hover:bg-primary-700"
                          }`}
                          title={inCart ? "Update cart" : "Add to cart"}
                        >
                          {inCart ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <ShoppingCart className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-3">No products found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={handleCloseCartDrawer}
        product={selectedProduct}
      />
    </div>
  );
}
