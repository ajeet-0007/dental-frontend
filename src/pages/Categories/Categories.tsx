import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api";
import { Search, ArrowRight, Grid3X3, List, Layers } from "lucide-react";

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
    },
  });

  const categories = Array.isArray(data) ? data : data?.data || [];
  const parentCategories = categories.filter((cat: any) => !cat.parentId);

  const getChildCount = (categoryId: number) => {
    return categories.filter((cat: any) => cat.parentId === categoryId).length;
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return parentCategories;
    const query = searchQuery.toLowerCase();
    return parentCategories.filter(
      (cat: any) =>
        cat.name?.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
    );
  }, [parentCategories, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="animate-pulse space-y-3 max-w-xl">
              <div className="h-10 w-32 bg-gray-100 rounded" />
              <div className="h-8 w-64 bg-gray-50 rounded" />
              <div className="h-4 w-48 bg-gray-50 rounded" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-50 rounded-xl" />
                <div className="mt-3 h-4 w-24 bg-gray-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 md:py-5">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Browse Products
              </p>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Categories
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Results */}
        <p className="text-sm text-gray-500 mb-6">
          {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
        </p>

        {filteredCategories.length > 0 ? (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
              >
                {filteredCategories.map((category: any, index: number) => {
                  const childCount = getChildCount(category.id);
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                    >
                      <Link
                        to={`/products?category=${category.slug}`}
                        className="group block"
                      >
                        <div className="aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group-hover:border-gray-200 group-hover:shadow-sm transition-all duration-300 relative">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <Layers className="h-10 w-10 md:h-12 md:w-12 text-gray-200 group-hover:text-primary-400 transition-colors" />
                            </div>
                          )}
                          {childCount > 0 && (
                            <span className="absolute top-2 right-2 text-[10px] font-medium text-gray-400 bg-white/80 px-1.5 py-0.5 rounded">
                              {childCount} sub
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate pr-2">
                            {category.name}
                          </h3>
                          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
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
                {filteredCategories.map((category: any, index: number) => {
                  const childCount = getChildCount(category.id);
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                    >
                      <Link
                        to={`/products?category=${category.slug}`}
                        className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="h-16 w-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <Layers className="h-6 w-6 text-gray-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                            {category.name}
                          </h3>
                          {childCount > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {childCount} {childCount === 1 ? "subcategory" : "subcategories"}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-400 text-sm">
              {searchQuery
                ? `No categories matching "${searchQuery}"`
                : "No categories found"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
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
