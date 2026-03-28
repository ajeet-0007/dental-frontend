import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import api from "@/api";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  maxFiles?: number;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  maxFiles = 1,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (maxFiles === 1 && files.length > 1) {
      toast.error("Only one image allowed");
      return;
    }

    setUploading(true);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/imagekit/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.url) {
        onChange(response.data.url);
        toast.success("Image uploaded successfully");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to upload image",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = () => {
    onChange(null);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {value ? (
          <div className="relative w-full h-48">
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/400x300?text=Image+Error";
              }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-primary-500", "bg-primary-50");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("border-primary-500", "bg-primary-50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-primary-500", "bg-primary-50");
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const input = fileInputRef.current;
                if (input) {
                  const dataTransfer = new DataTransfer();
                  for (let i = 0; i < files.length; i++) {
                    dataTransfer.items.add(files[i]);
                  }
                  input.files = dataTransfer.files;
                  handleFileSelect({ target: input } as any);
                }
              }
            }}
          >
            {uploading ? (
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click or drag to upload</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Supports JPG, PNG, WEBP. Max 1 image.
        </p>
      </div>
    </div>
  );
}
