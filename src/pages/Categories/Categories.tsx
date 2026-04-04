import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import { Grid3X3 } from "lucide-react";

export default function Categories() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-0">
      <div className="bg-primary-600 text-white py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Grid3X3 className="h-8 w-8 md:h-12 md:w-12" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Categories</h1>
              <p className="text-primary-100 mt-1 md:mt-2 text-sm md:text-base">
                Browse products by category
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {parentCategories.map((category: any, index: number) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex"
            >
              <Link
                to={`/products?category=${category.slug}`}
                className="flex flex-col w-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group active:scale-[0.98]"
              >
                <div className="h-16 md:h-28 bg-gray-100 overflow-hidden flex-shrink-0">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                      <Grid3X3 className="h-5 w-5 md:h-8 md:w-8 text-primary-400" />
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-3 flex-1 flex flex-col justify-between min-h-[70px] md:min-h-[90px]">
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {category.name}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    {getChildCount(category.id) > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {getChildCount(category.id)} sub
                      </span>
                    )}
                    <div className="flex items-center text-primary-600 font-medium text-[10px] md:text-xs">
                      <span>View</span>
                      <svg
                        className="w-2.5 h-2.5 md:w-3 md:h-3 ml-0.5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {parentCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
