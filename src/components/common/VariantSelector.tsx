import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

export interface ProductVariant {
  id: string;
  name?: string;
  sku?: string;
  price: number;
  sellingPrice: number;
  mrp: number;
  weight?: number;
  weightUnit?: string;
  image?: string;
  images?: string[];
  color?: string;
  size?: string;
  flavor?: string;
  packQuantity: number;
  isActive: boolean;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
}: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);

  const colors = [...new Set(variants.filter(v => v.color).map(v => v.color!))];
  const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size!))];
  const flavors = [...new Set(variants.filter(v => v.flavor).map(v => v.flavor!))];

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const hasFlavors = flavors.length > 0;
  const hasAnyAttributes = hasColors || hasSizes || hasFlavors;

  useEffect(() => {
    if (selectedVariant) {
      setSelectedColor(selectedVariant.color || null);
      setSelectedSize(selectedVariant.size || null);
      setSelectedFlavor(selectedVariant.flavor || null);
    }
  }, [selectedVariant]);

  useEffect(() => {
    if (!hasAnyAttributes) return;

    let filtered = variants;

    if (selectedColor) {
      filtered = filtered.filter(v => v.color === selectedColor);
    }
    if (selectedSize) {
      filtered = filtered.filter(v => v.size === selectedSize);
    }
    if (selectedFlavor) {
      filtered = filtered.filter(v => v.flavor === selectedFlavor);
    }

    if (filtered.length > 0 && !filtered.find(v => v.id === selectedVariant?.id)) {
      onVariantSelect(filtered[0]);
    }
  }, [selectedColor, selectedSize, selectedFlavor]);

  const getVariantDisplayName = (variant: ProductVariant) => {
    const parts: string[] = [];
    if (variant.color) parts.push(variant.color);
    if (variant.size) parts.push(variant.size);
    if (variant.flavor) parts.push(variant.flavor);
    if (variant.packQuantity > 1) parts.push(`${variant.packQuantity} pcs`);
    return parts.length > 0 ? parts.join(' - ') : variant.name || 'Default';
  };

  const getVariantPrice = (variant: ProductVariant) => {
    if (variant.sellingPrice !== variant.price) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary-600">₹{variant.sellingPrice}</span>
          <span className="text-sm text-gray-400 line-through">₹{variant.mrp}</span>
          {variant.sellingPrice < variant.mrp && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
              {Math.round((1 - variant.sellingPrice / variant.mrp) * 100)}% off
            </span>
          )}
        </div>
      );
    }
    return <span className="font-bold text-primary-600">₹{variant.sellingPrice}</span>;
  };

  const renderColorSelector = () => {
    if (!hasColors) return null;
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color {selectedColor && <span className="text-gray-500">({selectedColor})</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                selectedColor === color
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {selectedColor === color && <Check className="w-3 h-3 inline mr-1" />}
              {color}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSizeSelector = () => {
    if (!hasSizes) return null;
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size {selectedSize && <span className="text-gray-500">({selectedSize})</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                selectedSize === size
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {selectedSize === size && <Check className="w-3 h-3 inline mr-1" />}
              {size}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderFlavorSelector = () => {
    if (!hasFlavors) return null;
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Flavor {selectedFlavor && <span className="text-gray-500">({selectedFlavor})</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {flavors.map((flavor) => (
            <button
              key={flavor}
              onClick={() => setSelectedFlavor(flavor)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                selectedFlavor === flavor
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {selectedFlavor === flavor && <Check className="w-3 h-3 inline mr-1" />}
              {flavor}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderVariantCards = () => {
    if (hasAnyAttributes) return null;
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Variant
        </label>
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onVariantSelect(variant)}
            className={`w-full p-3 rounded-lg border text-left transition-all ${
              selectedVariant?.id === variant.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{getVariantDisplayName(variant)}</span>
              {getVariantPrice(variant)}
            </div>
            {variant.weight && (
              <span className="text-sm text-gray-500">{variant.weight}{variant.weightUnit}</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  if (variants.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-sm font-medium text-gray-800 mb-3">Product Options</h3>
      
      {renderColorSelector()}
      {renderSizeSelector()}
      {renderFlavorSelector()}
      {renderVariantCards()}

      {selectedVariant && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">
                {getVariantDisplayName(selectedVariant)}
              </span>
            </div>
            <div className="text-right">
              {getVariantPrice(selectedVariant)}
            </div>
          </div>
          {selectedVariant.sku && (
            <span className="text-xs text-gray-400">SKU: {selectedVariant.sku}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default VariantSelector;
