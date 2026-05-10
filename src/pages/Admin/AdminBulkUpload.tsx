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
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminBulkUpload() {
  const queryClient = useQueryClient();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post("/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (response) => {
      setResults(response.data);
      setShowResults(true);

      const { successCount, failureCount } = response.data;
      if (failureCount === 0) {
        toast.success(`All ${successCount} products uploaded successfully!`);
      } else {
        toast.error(
          `${successCount} succeeded, ${failureCount} failed. See details below.`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to process CSV file",
      );
    },
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/bulk-upload/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product-bulk-upload-template.csv");
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

  if (showResults && results) {
    const failedResults = results.results.filter(
      (r: any) => r.status === "failed",
    );
    const successResults = results.results.filter(
      (r: any) => r.status === "success",
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/products"
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Upload Results
              </h1>
              <p className="text-gray-500">
                Processed {results.totalRows} rows across {results.totalProducts}{" "}
                products
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
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.totalProducts}
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
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {results.failureCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {successResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Successfully Uploaded Products
            </h3>
            <div className="space-y-2">
              {successResults.map((result: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">
                      {result.productName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Row {result.row} • ID: {result.productId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {failedResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Failed Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Row
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Product Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {failedResults.map((result: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-red-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {result.row}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {result.productName}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600">
                        {result.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <Link
            to="/admin/products"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bulk Upload Products
            </h1>
            <p className="text-gray-500">
              Upload multiple products with variants via CSV
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          How it works
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Download the CSV template below</li>
          <li>Fill in your product data (one row per variant)</li>
          <li>For images, use URLs or local file paths</li>
          <li>Rows with the same product_name + product_sku are grouped as one product</li>
          <li>Upload the completed CSV file</li>
        </ol>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 1: Download Template
        </h3>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 2: Upload CSV File
        </h3>

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
                <p className="font-medium text-gray-900">
                  {uploadedFile.name}
                </p>
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
              <button
                onClick={resetUpload}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
