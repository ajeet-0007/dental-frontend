import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/api";
import { Layers } from "lucide-react";

export default function Departments() {
  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    },
  });

  const departments = Array.isArray(data) ? data : data?.data || [];

  const getDepartmentIcon = (name: string) => {
    const icons: Record<string, string> = {
      orthodontics: "🦷",
      endodontics: "🔧",
      periodontics: "🦴",
      prosthodontics: "😁",
      oralSurgery: "✂️",
      pediatricDentistry: "👶",
      restorativeDentistry: "✨",
      oralRadiology: "📷",
      oralPathology: "🔬",
      aestheticDentistry: "💎",
    };
    return icons[name.toLowerCase().replace(/\s+/g, "")] || "🏥";
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
            <Layers className="h-8 w-8 md:h-12 md:w-12" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Dental Departments</h1>
              <p className="text-primary-100 mt-1 md:mt-2 text-sm md:text-base">
                Browse products by dental specialty
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {departments.map((department: any, index: number) => (
            <motion.div
              key={department.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex"
            >
              <Link
                to={`/products?department=${department.slug}`}
                className="flex flex-col w-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group active:scale-[0.98]"
              >
                <div className="h-16 md:h-28 bg-gray-100 overflow-hidden flex-shrink-0">
                  {department.image ? (
                    <img
                      src={department.image}
                      alt={department.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                      <span className="text-3xl md:text-4xl">{getDepartmentIcon(department.name)}</span>
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-4 flex-1 flex flex-col justify-between min-h-[60px] md:min-h-[80px]">
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {department.name}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
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

        {departments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No departments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
