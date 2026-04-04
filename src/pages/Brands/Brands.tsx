import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-0">
      <div className="bg-primary-600 text-white py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Award className="h-8 w-8 md:h-12 md:w-12" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Our Brands</h1>
              <p className="text-primary-100 mt-1 md:mt-2 text-sm md:text-base">
                Explore products from trusted dental brands
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12">
        <div className="mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 min-w-max pb-2">
            {brands.slice(0, 8).map((brand: any) => (
              <div
                key={brand.id}
                className="h-12 md:h-16 w-24 md:w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-1.5 md:p-2"
              >
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs md:text-sm font-semibold text-gray-700 text-center line-clamp-1">
                    {brand.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {brands.map((brand: any, index: number) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex"
            >
              <Link
                to={`/products?brand=${brand.slug}`}
                className="flex flex-col w-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group active:scale-[0.98]"
              >
                <div className="h-16 md:h-24 bg-gray-50 flex items-center justify-center p-2 md:p-4 flex-shrink-0">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-10 md:h-14 w-10 md:w-14 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm md:text-xl font-bold text-primary-600">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-4 flex-1 flex flex-col justify-between min-h-[60px] md:min-h-[80px]">
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 text-center">
                    {brand.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-center text-primary-600 font-medium text-[10px] md:text-xs">
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
              </Link>
            </motion.div>
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
