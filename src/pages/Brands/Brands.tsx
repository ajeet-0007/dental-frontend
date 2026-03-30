import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Award } from "lucide-react";

export default function Brands() {
  const { data, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/brands");
      return response.data;
    },
  });

  const brands = Array.isArray(data) ? data : data?.data || [];

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
            <Award className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Our Brands</h1>
              <p className="text-primary-100 mt-2">
                Explore products from trusted dental brands
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex space-x-2">
              {brands.slice(0, 8).map((brand: any) => (
                <div
                  key={brand.id}
                  className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-2"
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700 text-center">
                      {brand.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brands.map((brand: any) => (
            <Link
              key={brand.id}
              to={`/products?brand=${brand.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="h-20 w-32 flex items-center justify-center mb-4">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-600">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {brand.name}
                </h3>
                {brand.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {brand.description}
                  </p>
                )}
                <div className="mt-4 flex items-center text-primary-600 font-medium">
                  <span>View Products</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
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
            </Link>
          ))}
        </div>

        {brands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No brands found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
