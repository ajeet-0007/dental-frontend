import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/api";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { formatPrice } from "@/utils/format";
import { Package, ChevronDown, ChevronUp, ChevronRight, X, SlidersHorizontal, ShoppingCart, Heart, ArrowUpDown, Tag, Layers, Store, PackageCheck, Loader2, Search, Home } from "lucide-react";
import CartDrawer from "@/components/common/CartDrawer";
import { PriceRangeSlider } from "@/components/common/PriceRangeSlider";
import Seo from "@/components/seo/Seo";
import { buildItemListJsonLd } from "@/components/seo/seoHelpers";


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

interface ProductsProps {
  categorySlug?: string;
  departmentSlug?: string;
  brandSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoCanonical?: string;
  seoJsonLd?: object | object[];
}

export default function Products({
  categorySlug,
  departmentSlug,
  brandSlug,
  seoTitle,
  seoDescription,
  seoCanonical,
  seoJsonLd,
}: ProductsProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
      categories: categorySlug
        ? [categorySlug]
        : urlCategories
          ? urlCategories.split(",").filter(Boolean)
          : [],
      departments: departmentSlug
        ? [departmentSlug]
        : urlDepartments
          ? urlDepartments.split(",").filter(Boolean)
          : [],
      brands: brandSlug
        ? [brandSlug]
        : urlBrands
          ? urlBrands.split(",").filter(Boolean)
          : [],
      minPrice: urlMinPrice || "",
      maxPrice: urlMaxPrice || "",
      inStock: urlInStock === "true",
    }));
  }, [searchParams, categorySlug, departmentSlug, brandSlug]);

  const buildParams = useCallback((p: number) => ({
    search: searchQuery || undefined,
    categories: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
    departments: filters.departments.length > 0 ? filters.departments.join(',') : undefined,
    brand: filters.brands.length > 0 ? filters.brands.join(',') : undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    inStock: filters.inStock || undefined,
    page: p,
    limit: 20,
    sortBy,
  }), [searchQuery, filters, sortBy]);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["products", searchQuery, filters, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      api.get("/products", { params: buildParams(pageParam) }).then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const products = data?.pages.flatMap((p: any) => p.products) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateURLParams = (newFilters: Filters, options?: { keepSearch?: boolean }) => {
    const keepSearch = options?.keepSearch ?? true;
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
    if (keepSearch && searchQuery) {
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
  };

  const hasActiveFilters = 
    !!searchQuery ||
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
    updateURLParams(emptyFilters, { keepSearch: false });
  };

  const removeSearch = () => {
    updateURLParams(filters, { keepSearch: false });
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

  const isEntityPage = !!(categorySlug || departmentSlug || brandSlug);
  const filterNames = [
    ...filters.categories
      .map((slug) => categories.find((c: any) => c.slug === slug)?.name)
      .filter(Boolean),
    ...filters.departments
      .map((slug) => departments.find((d: any) => d.slug === slug)?.name)
      .filter(Boolean),
    ...filters.brands
      .map((slug) => brands.find((b: any) => b.slug === slug)?.name)
      .filter(Boolean),
  ];

  const shouldNoindex = (!isEntityPage && hasActiveFilters) || !!searchQuery;

  const seoDescriptionValue =
    seoDescription ||
    (filterNames.length
      ? `Shop ${filterNames.join(", ")} dental products online at the best prices.`
      : "Shop dental products online at the best prices.");

  const derivedCanonical = isEntityPage && seoCanonical ? seoCanonical : "/products";
  const itemListJsonLd = seoJsonLd || buildItemListJsonLd(products.slice(0, 20));

  const listingTitle = isEntityPage && seoTitle
    ? seoTitle
    : searchQuery
      ? `Search Results for "${searchQuery}"`
      : "Buy Dental Products Online";

  return (
    <>
      <Seo
        title={listingTitle}
        description={seoDescriptionValue}
        canonical={derivedCanonical}
        noindex={shouldNoindex}
        jsonLd={itemListJsonLd}
      />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
              <Home className="w-3 h-3" />
              <ChevronRight className="w-3 h-3" />
              <span>{isEntityPage ? (categorySlug ? "Categories" : departmentSlug ? "Departments" : "Brands") : "Products"}</span>
              {isEntityPage && seoTitle && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-primary-600 font-medium">{seoTitle}</span>
                </>
              )}
              {!isEntityPage && searchQuery && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-primary-600 font-medium">"{searchQuery}"</span>
                </>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
              {isEntityPage && seoTitle
                ? seoTitle
                : searchQuery
                  ? `Results for "${searchQuery}"`
                  : "All Products"}
            </h1>
          </div>
        </div>
        {total > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-full">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            {total} items
          </div>
        )}
      </div>
      {/* Horizontal Filter Chips Bar */}
      <div className="mb-5">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 whitespace-nowrap"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-gradient-to-br from-primary-500 to-blue-600 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                {filters.categories.length + filters.departments.length + filters.brands.length + (filters.inStock ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0) + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-600 font-semibold whitespace-nowrap px-2"
            >
              Clear All
            </button>
          )}

          {/* Search Chip */}
          {searchQuery && (
            <button
              onClick={removeSearch}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap bg-gradient-to-r from-primary-500 to-blue-600 text-white border-transparent shadow-md shadow-primary-500/25"
              aria-label={`Remove search "${searchQuery}"`}
            >
              <Search className="h-3.5 w-3.5" />
              {searchQuery}
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Category Chips */}
          {categories.slice(0, 8).map((cat: any) => {
            const isSelected = filters.categories.includes(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => toggleCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? "bg-gradient-to-r from-primary-500 to-blue-600 text-white border-transparent shadow-md shadow-primary-500/25"
                    : "bg-white text-gray-600 border-gray-200 shadow-sm hover:shadow-md hover:border-primary-400 hover:bg-primary-50"
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                {cat.name}
                {isSelected && <X className="h-3 w-3" />}
              </button>
            );
          })}

          {/* Department Chips */}
          {departments.slice(0, 6).map((dept: any) => {
            const isSelected = filters.departments.includes(dept.slug);
            return (
              <button
                key={dept.slug}
                onClick={() => toggleDepartment(dept.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent shadow-md shadow-green-500/25"
                    : "bg-white text-gray-600 border-gray-200 shadow-sm hover:shadow-md hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                {dept.name}
                {isSelected && <X className="h-3 w-3" />}
              </button>
            );
          })}

          {/* Brand Chips */}
          {brands.slice(0, 6).map((brand: any) => {
            const isSelected = filters.brands.includes(brand.slug);
            return (
              <button
                key={brand.slug}
                onClick={() => toggleBrand(brand.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md shadow-amber-500/25"
                    : "bg-white text-gray-600 border-gray-200 shadow-sm hover:shadow-md hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                {brand.name}
                {isSelected && <X className="h-3 w-3" />}
              </button>
            );
          })}

          {/* In Stock Filter Chip */}
          <button
            onClick={() => {
              setFilters((p) => {
                const newFilters = { ...p, inStock: !p.inStock };
                updateURLParams(newFilters);
                return newFilters;
              });
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap ${
              filters.inStock
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-md shadow-emerald-500/25"
                : "bg-white text-gray-600 border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-emerald-50"
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            In Stock
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-gray-100 rounded-2xl p-5 h-[calc(100vh-6rem)] overflow-y-auto shadow-sm">
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
              }}
              onInStockChange={(checked) => {
                setFilters((prev) => {
                  const newFilters = { ...prev, inStock: checked };
                  updateURLParams(newFilters);
                  return newFilters;
                });
              }}
            />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white z-50 overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-lg text-gray-800">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
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
                }}
                onInStockChange={(checked) => {
                  setFilters((prev) => {
                    const newFilters = { ...prev, inStock: checked };
                    updateURLParams(newFilters);
                    return newFilters;
                  });
                }}
              />
              <button
                onClick={() => setShowFilters(false)}
                className="w-full mt-6 py-3 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors"
              >
                Show Results
              </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Sort and Results Count */}
          <div className="flex items-center justify-between mb-5 gap-2">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900 font-semibold">{total}</span> products
            </p>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-primary-400 transition-all duration-200"
                title="Sort"
              >
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <span className="hidden sm:inline text-gray-700">
                  {sortOptions.find((o) => o.value === sortBy)?.label || "Sort"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === option.value
                            ? "text-primary-600 font-semibold bg-primary-50"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
                >
                  <div className="aspect-square animate-shimmer"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 animate-shimmer rounded-lg w-3/4"></div>
                    <div className="h-3 animate-shimmer rounded-lg w-1/2"></div>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="h-5 animate-shimmer rounded-lg w-1/3"></div>
                      <div className="h-3 animate-shimmer rounded-lg w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map((product: any, index: number) => {
                  const inCart = isInCart(product.id.toString());
                  const inWishlist = isInWishlist(product.id.toString());
                  const variants = product.variants || [];
                  const activeVariants = variants.filter((v: any) => v.isActive);
                  const hasVariants = activeVariants.length > 0;
                  
                  const inventories = product.inventories || [];
                  let totalStock = -1;
                  let hasAnyStock = false;
                  
                  if (inventories.length > 0) {
                    totalStock = inventories.reduce((sum: number, inv: any) => {
                      const available = (inv.quantity || 0) - (inv.reservedQuantity || 0);
                      return sum + available;
                    }, 0);
                    hasAnyStock = inventories.some((inv: any) => ((inv.quantity || 0) - (inv.reservedQuantity || 0)) > 0);
                  }
                  
                  const isOutOfStock = hasVariants 
                    ? (inventories.length > 0 && !hasAnyStock)
                    : totalStock <= 0;
                  
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
                  
                  const colors = [...new Set(activeVariants.filter((v: any) => v.color).map((v: any) => v.color as string))] as string[];
                  const discount = product.mrp > minPrice ? Math.round(((product.mrp - minPrice) / product.mrp) * 100) : 0;
                  
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
                      className={`group relative bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 ${
                        isOutOfStock
                          ? 'opacity-60'
                          : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50'
                      }`}
                    >
                      <Link
                        to={isOutOfStock ? '#' : `/products/${product.slug}`}
                        onClick={(e) => isOutOfStock && e.preventDefault()}
                        className={`block ${isOutOfStock ? 'cursor-not-allowed pointer-events-none' : ''}`}
                      >
                        <div className="aspect-square bg-gray-50 overflow-hidden relative">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-60 grayscale-[30%]' : ''}`}
                              loading="lazy"
                            />
                          ) : (
                            <img
                              src={DEFAULT_IMAGE}
                              alt={product.name}
                              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-60 grayscale-[30%]' : ''}`}
                              loading="lazy"
                            />
                          )}
                          {discount > 0 && !isOutOfStock && (
                            <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md shadow-red-500/30">
                              {discount}% OFF
                            </div>
                          )}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-gray-900/80 text-white px-4 py-1.5 text-sm font-semibold rounded-full backdrop-blur-sm">
                                Out of Stock
                              </span>
                            </div>
                          )}
                          {colors.length > 0 && !isOutOfStock && (
                            <div className="absolute bottom-2.5 left-2.5 flex -space-x-1.5">
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
                        <div className="p-3 md:p-4">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 leading-snug">
                              {product.name}
                            </h3>
                            {hasVariants && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-full whitespace-nowrap shrink-0">
                                <Package className="w-3 h-3" />
                                {activeVariants.length}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold text-primary-600">
                                {showPriceRange ? `From ₹${formatPrice(minPrice)}` : `₹${formatPrice(minPrice)}`}
                              </span>
                              {product.mrp > minPrice && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{formatPrice(product.mrp)}
                                </span>
                              )}
                            </div>
                            {!isOutOfStock && (
                              <button
                                onClick={(e) => handleOpenCartDrawer(e, product)}
                                className={`p-2 rounded-xl transition-all duration-200 active:scale-90 ${
                                  inCart
                                    ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/25"
                                    : "bg-primary-50 text-primary-600 hover:bg-primary-100 hover:shadow-md"
                                }`}
                                title={inCart ? "Update cart" : "Add to cart"}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                      
                      <button
                        onClick={(e) => handleToggleWishlist(e, product)}
                        className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                          inWishlist
                            ? "bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30"
                            : "bg-white/80 backdrop-blur-sm text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 shadow-md"
                        }`}
                        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? "fill-white" : ""}`} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-6">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-primary-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more...</span>
                  </div>
                )}
                {!hasNextPage && products.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300" />
                    <p className="text-xs text-gray-400 font-medium">You&apos;ve seen it all</p>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg"
              >
                <Search className="h-10 w-10 text-gray-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-blue-600 text-white font-semibold text-sm rounded-full shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 active:scale-95"
                >
                  <X className="h-4 w-4" />
                  Clear all filters
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
    </div>
    </>
  );
}
