import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api";
import { Search, ArrowRight, Grid3X3, List, Store } from "lucide-react";

const INITIAL_COLORS = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-red-500 to-red-600",
  "from-indigo-500 to-indigo-600",
];

function getBrandInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function Brands() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/brands");
      return response.data;
    },
  });

  const brands = Array.isArray(data) ? data : data?.data || [];

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(
      (brand: any) =>
        brand.name?.toLowerCase().includes(query) ||
        brand.description?.toLowerCase().includes(query)
    );
  }, [brands, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-3 max-w-xl mb-8">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-48 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="mt-3 h-4 w-24 bg-gray-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 md:py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                  Top Picks
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Our Brands
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Search */}
        <div className="relative max-w-md mb-6 -mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-0 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:shadow-lg transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-5">
          {filteredBrands.length} {filteredBrands.length === 1 ? "brand" : "brands"}
        </p>

        {filteredBrands.length > 0 ? (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
              >
                {filteredBrands.map((brand: any, index: number) => {
                  const colorIndex = Math.abs(brand.id - 1) % INITIAL_COLORS.length;
                  const gradientClass = INITIAL_COLORS[colorIndex];
                  return (
                    <motion.div
                      key={brand.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                      <Link
                        to={`/products?brand=${brand.slug}`}
                        className="group block"
                      >
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden group-hover:shadow-lg group-hover:border-gray-200 group-hover:-translate-y-1 transition-all duration-300">
                          <div className="aspect-square bg-gray-50/50 overflow-hidden p-2 flex items-center justify-center">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                <span className="text-2xl font-bold text-white">
                                  {getBrandInitial(brand.name)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="px-3 pb-3 text-center">
                            <h3 className="font-semibold text-sm text-gray-700 leading-tight line-clamp-2 mt-2 group-hover:text-purple-600 transition-colors">
                              {brand.name}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {filteredBrands.map((brand: any, index: number) => {
                  const colorIndex = Math.abs(brand.id - 1) % INITIAL_COLORS.length;
                  const gradientClass = INITIAL_COLORS[colorIndex];
                  return (
                    <motion.div
                      key={brand.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                    >
                      <Link
                        to={`/products?brand=${brand.slug}`}
                        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all"
                      >
                        <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 p-1 flex items-center justify-center">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain rounded-lg transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                              <span className="text-lg font-bold text-white">
                                {getBrandInitial(brand.name)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                            {brand.name}
                          </h3>
                          {brand.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {brand.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              {searchQuery
                ? `No brands matching "${searchQuery}"`
                : "No brands found"}
            </p>
            <p className="text-gray-400 text-xs">
              Try adjusting your search
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium bg-purple-50 px-4 py-2 rounded-lg transition-colors"
              >
                Clear search
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
