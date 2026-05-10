import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  X,
  Building2,
  Tag,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";

type EntityType = "departments" | "brands" | "categories";

interface BulkResult {
  row: number;
  name: string;
  status: "success" | "skipped" | "failed";
  reason?: string;
  error?: string;
  departmentId?: number;
  brandId?: number;
  categoryId?: number;
}

interface BulkResponse {
  totalRows: number;
  successCount: number;
  skippedCount: number;
  failureCount: number;
  results: BulkResult[];
}

const entityConfig = {
  departments: {
    label: "Departments",
    icon: Building2,
    templateEndpoint: "/entity-bulk-upload/departments/template",
    uploadEndpoint: "/entity-bulk-upload/departments",
    filename: "departments-bulk-upload-template.csv",
    idField: "departmentId",
  },
  brands: {
    label: "Brands",
    icon: Tag,
    templateEndpoint: "/entity-bulk-upload/brands/template",
    uploadEndpoint: "/entity-bulk-upload/brands",
    filename: "brands-bulk-upload-template.csv",
    idField: "brandId",
  },
  categories: {
    label: "Categories",
    icon: Layers,
    templateEndpoint: "/entity-bulk-upload/categories/template",
    uploadEndpoint: "/entity-bulk-upload/categories",
    filename: "categories-bulk-upload-template.csv",
    idField: "categoryId",
  },
};

export default function AdminEntityBulkUpload() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EntityType>("departments");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [results, setResults] = useState<BulkResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const config = entityConfig[activeTab];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(config.uploadEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (response) => {
      setResults(response.data);
      setShowResults(true);

      const { successCount, skippedCount, failureCount } = response.data;
      if (failureCount === 0 && skippedCount === 0) {
        toast.success(`All ${successCount} ${config.label.toLowerCase()} uploaded successfully!`);
      } else if (failureCount === 0) {
        toast.success(
          `${successCount} created, ${skippedCount} skipped (duplicates/existing).`
        );
      } else {
        toast.error(
          `${successCount} succeeded, ${skippedCount} skipped, ${failureCount} failed.`
        );
      }

      if (activeTab === "departments") {
        queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
      } else if (activeTab === "brands") {
        queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to process CSV file"
      );
    },
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(config.templateEndpoint, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", config.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      setUploadedFile(file);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setUploadedFile(file);
    } else {
      toast.error("Please drop a valid CSV file");
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) {
      toast.error("Please select a CSV file first");
      return;
    }
    uploadMutation.mutate(uploadedFile);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setResults(null);
    setShowResults(false);
  };

  const switchTab = (tab: EntityType) => {
    setActiveTab(tab);
    resetUpload();
  };

  if (showResults && results) {
    const failedResults = results.results.filter((r) => r.status === "failed");
    const skippedResults = results.results.filter((r) => r.status === "skipped");
    const successResults = results.results.filter((r) => r.status === "success");

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={resetUpload}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Upload Results - {config.label}
              </h1>
              <p className="text-gray-500">
                Processed {results.totalRows} rows
              </p>
            </div>
          </div>
          <button
            onClick={resetUpload}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Upload Another File
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.totalRows}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Success</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.successCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Skipped</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {results.skippedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {results.failureCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Failed ({results.failureCount})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Row</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {failedResults.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-red-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{result.row}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{result.name}</td>
                      <td className="py-3 px-4 text-sm text-red-600">{result.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {skippedResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Skipped ({results.skippedCount})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Row</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedResults.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-yellow-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{result.row}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{result.name}</td>
                      <td className="py-3 px-4 text-sm text-yellow-600">{result.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {successResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Successfully Created ({results.successCount})
            </h3>
            <div className="space-y-2">
              {successResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">{result.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">Row {result.row}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entity Bulk Upload</h1>
            <p className="text-gray-500">Upload departments, brands, or categories via CSV</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(Object.keys(entityConfig) as EntityType[]).map((tab) => {
          const TabIcon = entityConfig[tab].icon;
          return (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {entityConfig[tab].label}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          How it works
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Download the CSV template for {config.label.toLowerCase()}</li>
          <li>Fill in your data (one row per entity)</li>
          <li>Duplicate names in CSV or existing in DB will be skipped silently</li>
          <li>Upload the completed CSV file</li>
        </ol>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Download Template</h3>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Download className="w-4 h-4" />
          Download {config.label} CSV Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload CSV File</h3>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-400"
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop your CSV file here, or{" "}
            <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
              browse
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-sm text-gray-400">Only CSV files accepted</p>
        </div>

        {uploadedFile && (
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Process
                  </>
                )}
              </button>
              <button onClick={resetUpload} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}