import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api";
import { Search, ArrowRight, Grid3X3, List, Layers, Stethoscope } from "lucide-react";

export default function Departments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    },
  });

  const departments = Array.isArray(data) ? data : data?.data || [];

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const query = searchQuery.toLowerCase();
    return departments.filter(
      (dept: any) =>
        dept.name?.toLowerCase().includes(query) ||
        dept.description?.toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

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
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                  Browse by Specialty
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Departments
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
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-0 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:shadow-lg transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-5">
          {filteredDepartments.length} {filteredDepartments.length === 1 ? "department" : "departments"}
        </p>

        {filteredDepartments.length > 0 ? (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
              >
                {filteredDepartments.map((department: any, index: number) => (
                  <motion.div
                    key={department.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <Link
                      to={`/products?department=${department.slug}`}
                      className="group block"
                    >
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden group-hover:shadow-lg group-hover:border-gray-200 group-hover:-translate-y-1 transition-all duration-300">
                        <div className="aspect-square bg-gray-50/50 overflow-hidden p-2">
                          {department.image ? (
                            <img
                              src={department.image}
                              alt={department.name}
                              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                              <Layers className="h-10 w-10 md:h-12 md:w-12 text-gray-200 group-hover:text-rose-400 transition-colors" />
                            </div>
                          )}
                        </div>
                        <div className="px-3 pb-3 text-center">
                          <h3 className="font-semibold text-sm text-gray-700 leading-tight line-clamp-2 mt-2 group-hover:text-rose-600 transition-colors">
                            {department.name}
                          </h3>
                          {department.description && (
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                              {department.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {filteredDepartments.map((department: any, index: number) => (
                  <motion.div
                    key={department.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <Link
                      to={`/products?department=${department.slug}`}
                      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all"
                    >
                      <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 p-1">
                        {department.image ? (
                          <img
                            src={department.image}
                            alt={department.name}
                            className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                            <Layers className="h-6 w-6 text-gray-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                          {department.name}
                        </h3>
                        {department.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {department.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  </motion.div>
                ))}
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
              <Stethoscope className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              {searchQuery
                ? `No departments matching "${searchQuery}"`
                : "No departments found"}
            </p>
            <p className="text-gray-400 text-xs">
              Try adjusting your search
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium bg-rose-50 px-4 py-2 rounded-lg transition-colors"
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
