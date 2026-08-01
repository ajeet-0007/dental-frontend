import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import Products from "@/pages/Products/Products";
import Seo from "@/components/seo/Seo";
import { truncateDescription, buildBreadcrumbJsonLd } from "@/components/seo/seoHelpers";

type EntityType = "category" | "department" | "brand";

const ENDPOINTS: Record<EntityType, string> = {
  category: "/categories/slug/",
  department: "/departments/slug/",
  brand: "/brands/slug/",
};

const URL_PREFIX: Record<EntityType, string> = {
  category: "/categories/",
  department: "/departments/",
  brand: "/brands/",
};

const LIST_LABELS: Record<EntityType, string> = {
  category: "Categories",
  department: "Departments",
  brand: "Brands",
};

function EntityProductsPage({ type }: { type: EntityType }) {
  const { slug } = useParams();

  const { data: entity, isError } = useQuery({
    queryKey: [type, "slug", slug],
    queryFn: async () => {
      const res = await api.get(`${ENDPOINTS[type]}${slug}`);
      return res.data;
    },
    enabled: !!slug,
    retry: false,
  });

  const path = `${URL_PREFIX[type]}${slug}`;
  const entityName = entity?.name || "";
  const description = truncateDescription(
    entity?.description ||
      entity?.longDescription ||
      (entityName ? `Shop ${entityName} dental products online at the best prices.` : ""),
    155
  );

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: LIST_LABELS[type], path: `/${LIST_LABELS[type].toLowerCase()}` },
    { name: entityName || slug || "", path },
  ]);

  if (isError) {
    return (
      <>
        <Seo title={entityName || "Page Not Found"} noindex />
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
            <p>The {type} you are looking for does not exist.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title={entityName} description={description} canonical={path} jsonLd={breadcrumb} />
      <Products
        categorySlug={type === "category" ? slug : undefined}
        departmentSlug={type === "department" ? slug : undefined}
        brandSlug={type === "brand" ? slug : undefined}
        seoTitle={entityName}
        seoDescription={description}
        seoCanonical={path}
        seoJsonLd={breadcrumb}
      />
    </>
  );
}

export function CategoryProductsPage() {
  return <EntityProductsPage type="category" />;
}

export function DepartmentProductsPage() {
  return <EntityProductsPage type="department" />;
}

export function BrandProductsPage() {
  return <EntityProductsPage type="brand" />;
}
