import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Layers className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Dental Departments</h1>
              <p className="text-primary-100 mt-2">
                Browse products by dental specialty
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((department: any) => (
            <Link
              key={department.id}
              to={`/products?department=${department.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              <div className="h-40 bg-gray-100 overflow-hidden">
                {department.image ? (
                  <img
                    src={department.image}
                    alt={department.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <span className="text-5xl">{getDepartmentIcon(department.name)}</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {department.name}
                </h3>
                {department.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {department.description}
                  </p>
                )}
                <div className="mt-3 flex items-center text-primary-600 font-medium text-sm">
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
            </Link>
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
