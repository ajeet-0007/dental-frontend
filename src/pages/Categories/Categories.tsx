import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Grid3X3 className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="text-primary-100 mt-2">
                Browse products by category
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {parentCategories.map((category: any) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              <div className="h-40 bg-gray-100 overflow-hidden">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <Grid3X3 className="h-12 w-12 text-primary-400" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {getChildCount(category.id) > 0 && (
                    <span className="text-xs text-gray-500">
                      {getChildCount(category.id)} subcategories
                    </span>
                  )}
                  <div className="flex items-center text-primary-600 font-medium text-sm">
                    <span>Browse Products</span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
