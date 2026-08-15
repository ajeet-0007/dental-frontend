import { Link } from "react-router-dom";
import { SearchX, Home, Package, Store } from "lucide-react";
import Seo from "@/components/seo/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" noindex />
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/20 mx-auto mb-6">
            <SearchX className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h1>
          <p className="text-gray-500 mb-8">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-primary-300 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <Package className="w-4 h-4" />
              Browse Products
            </Link>
            <Link
              to="/brands"
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-primary-300 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <Store className="w-4 h-4" />
              Explore Brands
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
