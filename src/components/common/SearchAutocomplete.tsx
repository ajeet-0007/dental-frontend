import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, ArrowRight, X, Loader2, Store, Tag, Layers, ChevronRight } from "lucide-react";
import api from "@/api";
import { formatPrice } from "@/utils/format";

interface SuggestionProduct {
  id: number;
  name: string;
  slug: string;
  sellingPrice: number;
  mrp?: number;
  images?: string[];
  brandEntity?: { name?: string } | null;
  brand?: string;
}

interface SuggestionEntity {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  image?: string;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  variant?: "desktop" | "mobile";
  micButton?: ReactNode;
}

export interface SearchAutocompleteHandle {
  setValue: (value: string) => void;
}

const TYPEWRITER_PHRASES = [
  "Search for products...",
  "Search for brands...",
  "Search for categories...",
  'Try "aligners"...',
  'Try "microbrush"...',
];

function useTypewriter(
  phrases: string[],
  typeSpeed = 60,
  deleteSpeed = 30,
  holdTime = 1600,
) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0) return;
    const current = phrases[phraseIndex % phrases.length];
    let timeout: number;

    if (!deleting && text === current) {
      timeout = window.setTimeout(() => setDeleting(true), holdTime);
    } else if (deleting && text === "") {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    } else {
      timeout = window.setTimeout(
        () => {
          setText((prev) =>
            deleting
              ? current.slice(0, prev.length - 1)
              : current.slice(0, prev.length + 1),
          );
        },
        deleting ? deleteSpeed : typeSpeed,
      );
    }
    return () => window.clearTimeout(timeout);
  }, [text, deleting, phraseIndex, phrases, typeSpeed, deleteSpeed, holdTime]);

  return text;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-100 text-gray-900 rounded-sm px-0">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

function EntityRow({
  label,
  icon: Icon,
  items,
  base,
  imageField,
  onNavigate,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SuggestionEntity[];
  base: string;
  imageField?: "logo" | "image";
  onNavigate: () => void;
}) {
  return (
    <div className="pt-3 pb-1">
      <span className="px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      {items.map((item) => {
        const imageSrc = imageField ? item[imageField] : undefined;
        return (
          <Link
            key={item.id}
            to={`${base}/${item.slug}`}
            onClick={onNavigate}
            className="flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-gray-50"
          >
            <span className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center">
                  <Icon className="h-4 w-4 text-gray-400" />
                </span>
              )}
            </span>
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate">
              {item.name}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

const SearchAutocomplete = forwardRef<
  SearchAutocompleteHandle,
  SearchAutocompleteProps
>(function SearchAutocomplete(
  { placeholder = "Search products...", variant = "desktop", micButton },
  ref,
) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const typedText = useTypewriter(TYPEWRITER_PHRASES);

  useImperativeHandle(ref, () => ({
    setValue: (v: string) => {
      setValue(v);
      setIsOpen(true);
      setDebounced(v);
    },
  }));

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = value.trim();

  const searchQuery = useQuery({
    queryKey: ["search-suggestions", debounced],
    queryFn: () =>
      api.get(`/products/search/${encodeURIComponent(debounced)}?limit=6`),
    enabled: isOpen && debounced.trim().length >= 2,
    staleTime: 60_000,
  });

  const popularQuery = useQuery({
    queryKey: ["search-popular"],
    queryFn: () => api.get("/products/top-selling?limit=5"),
    enabled: isOpen && debounced.trim().length < 2,
    staleTime: 5 * 60_000,
  });

  const searchResults = searchQuery.data?.data;
  const popularResults = popularQuery.data?.data;

  const products: SuggestionProduct[] =
    debounced.trim().length >= 2
      ? searchResults?.products || []
      : Array.isArray(popularResults)
        ? popularResults
        : popularResults?.products || [];

  const brands: SuggestionEntity[] =
    debounced.trim().length >= 2 ? searchResults?.brands || [] : [];
  const categories: SuggestionEntity[] =
    debounced.trim().length >= 2 ? searchResults?.categories || [] : [];
  const departments: SuggestionEntity[] =
    debounced.trim().length >= 2 ? searchResults?.departments || [] : [];

  const isSearching = debounced.trim().length >= 2;
  const hasEntityMatches =
    brands.length > 0 || categories.length > 0 || departments.length > 0;

  const showDropdown = isOpen;
  const isLoading = debounced.trim().length >= 2 && searchQuery.isFetching;
  const hasResults = products.length > 0;

  const closeAndReset = () => {
    setValue("");
    setDebounced("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectProduct = (product: SuggestionProduct) => {
    navigate(`/products/${product.slug}`);
    closeAndReset();
  };

  const goToAllResults = () => {
    if (!trimmed) return;
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (!hasResults) return;
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % products.length);
    } else if (event.key === "ArrowUp") {
      if (!hasResults) return;
      event.preventDefault();
      setActiveIndex(
        (i) => (i - 1 + products.length) % products.length,
      );
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && products[activeIndex]) {
        event.preventDefault();
        selectProduct(products[activeIndex]);
      } else if (trimmed.length >= 2) {
        event.preventDefault();
        goToAllResults();
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const isDesktop = variant === "desktop";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={!value && !focused ? "" : placeholder}
          className={
            isDesktop
              ? "w-full px-5 py-3 pl-12 pr-24 rounded-full bg-white border-2 border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all duration-200 text-sm placeholder-gray-400 shadow-sm"
              : "w-full px-3 py-1.5 pl-8 pr-16 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          }
        />
        {!value && !focused && (
          <span
            aria-hidden="true"
            className={`absolute top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none whitespace-nowrap overflow-hidden ${
              isDesktop ? "left-12 right-16" : "left-8 right-12"
            }`}
          >
            {typedText}
            <span className="inline-block w-0.5 h-4 bg-gray-400 animate-pulse align-middle ml-0.5" />
          </span>
        )}
        <Search
          className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors ${
            isDesktop ? "left-4" : "left-2.5 h-4 w-4"
          }`}
        />
        <div
          className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 ${
            isDesktop ? "" : ""
          }`}
        >
          {micButton}
          {value && (
            <button
              onClick={() => {
                setValue("");
                setDebounced("");
                setIsOpen(false);
                setActiveIndex(-1);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={
              isDesktop
                ? "absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                : "fixed top-16 left-0 right-0 mx-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            }
          >
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {isSearching ? "Search Results" : "Popular Products"}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Searching products...</span>
                </div>
              ) : (
                <>
                  {isSearching && hasEntityMatches && (
                    <div className="border-b border-gray-100 pb-1">
                      {brands.length > 0 && (
                        <EntityRow
                          label="Brands"
                          icon={Store}
                          items={brands}
                          base="/brands"
                          imageField="logo"
                          onNavigate={closeAndReset}
                        />
                      )}
                      {categories.length > 0 && (
                        <EntityRow
                          label="Categories"
                          icon={Tag}
                          items={categories}
                          base="/categories"
                          imageField="image"
                          onNavigate={closeAndReset}
                        />
                      )}
                      {departments.length > 0 && (
                        <EntityRow
                          label="Departments"
                          icon={Layers}
                          items={departments}
                          base="/departments"
                          imageField="image"
                          onNavigate={closeAndReset}
                        />
                      )}
                    </div>
                  )}
                  {hasResults ? (
                    <>
                      {isSearching && (
                        <div className="px-5 pt-3 pb-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Products
                        </div>
                      )}
                      {products.map((product, index) => {
                  const brandName =
                    product.brandEntity?.name || product.brand || "";
                  const hasMrp =
                    product.mrp != null &&
                    Number(product.mrp) > Number(product.sellingPrice);
                  return (
                    <button
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                        activeIndex === index
                          ? "bg-primary-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {highlight(product.name, trimmed)}
                        </p>
                        {brandName && (
                          <p className="text-xs text-gray-400 truncate">
                            {brandName}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary-600">
                          ₹{formatPrice(product.sellingPrice)}
                        </p>
                        {hasMrp && (
                          <p className="text-xs text-gray-400 line-through">
                            ₹{formatPrice(product.mrp)}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    </button>
                  );
                      })}
                    </>
                  ) : (
                    !hasEntityMatches && (
                      <div className="px-5 py-10 text-center">
                        <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          {isSearching
                            ? `No results found for "${trimmed}"`
                            : "No products available"}
                        </p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>

            {debounced.trim().length >= 2 && (
              <Link
                to={`/products?search=${encodeURIComponent(trimmed)}`}
                onClick={() => {
                  setIsOpen(false);
                  setActiveIndex(-1);
                }}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
              >
                View all results
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SearchAutocomplete;
