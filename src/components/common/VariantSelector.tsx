import { Package, Calendar } from 'lucide-react';

export interface ProductVariantOption {
  optionId: number;
  optionName: string;
  optionValueId: number;
  optionValue: string;
  hexCode?: string | null;
}

export interface ProductOptionValue {
  id: number;
  value: string;
  hexCode?: string | null;
  swatchUrl?: string | null;
  position: number;
}

export interface ProductOption {
  id: number;
  productId: number;
  name: string;
  position: number;
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  name?: string;
  sku?: string;
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
  expiresAt?: string;
  options?: ProductVariantOption[];
  isBase?: boolean;
  availableOptions?: ProductOption[];
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  options?: ProductOption[];
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant) => void;
  inventories?: { variantId: string; quantity: number }[];
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
  inventories = [],
}: VariantSelectorProps) {

  const getVariantStock = (variantId: string) => {
    const inv = inventories.find(i => i.variantId === variantId);
    return inv?.quantity ?? -1;
  };
  const hasAvailableOptions = variants.length > 0 && (variants[0]?.availableOptions?.length ?? 0) > 0;

  const getVariantDisplayName = (variant: ProductVariant) => {
    if (variant.options && variant.options.length > 0) {
      return variant.options.map(opt => opt.optionValue).join(' - ');
    }
    
    const parts: string[] = [];
    if (variant.color) parts.push(variant.color);
    if (variant.size) parts.push(variant.size);
    if (variant.flavor) parts.push(variant.flavor);
    
    if (variant.packQuantity > 1) parts.push(`${variant.packQuantity} pcs`);
    return parts.length > 0 ? parts.join(' - ') : variant.name || 'Standard';
  };

  const getVariantPrice = (variant: ProductVariant) => {
    if (variant.sellingPrice < variant.mrp) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary-600">₹{variant.sellingPrice}</span>
          <span className="text-sm text-gray-400 line-through">₹{variant.mrp}</span>
          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
            {Math.round((1 - variant.sellingPrice / variant.mrp) * 100)}% off
          </span>
        </div>
      );
    }
    return <span className="font-bold text-primary-600">₹{variant.sellingPrice}</span>;
  };

  if (variants.length === 0) return null;

  const firstVariant = variants[0];

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-sm font-medium text-gray-800 mb-3">Select Variant</h3>
      
      {hasAvailableOptions && firstVariant?.availableOptions && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-700">
            <span className="font-medium">Available options:</span>{' '}
            {firstVariant.availableOptions.map(opt => opt.name).join(', ')}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {variants.map((variant, index) => {
          const isSelected = selectedVariant?.id === variant.id;
          const variantName = getVariantDisplayName(variant);
          const isStandard = index === 0;
          const stock = getVariantStock(variant.id);
          const isOutOfStock = stock === 0;

          return (
            <button
              key={variant.id}
              onClick={() => onVariantSelect(variant)}
              disabled={isOutOfStock}
              className={`w-full p-3 rounded-lg border-2 transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ${
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-primary-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  )}
                </div>
                
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {variant.image || variant.images?.[0] ? (
                    <img 
                      src={variant.image || variant.images?.[0]} 
                      alt={variantName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-gray-900">
                    {isStandard ? 'Standard' : variantName}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 truncate">
                      {isStandard ? variantName : variant.sku || 'No SKU'}
                    </span>
                    {stock >= 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isOutOfStock 
                          ? 'bg-red-100 text-red-600' 
                          : stock <= 5 
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-green-100 text-green-600'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 sm:ml-auto">
                {getVariantPrice(variant)}
              </div>
            </button>
          );
        })}
      </div>

      {selectedVariant && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {selectedVariant.sku && (
              <span className="text-xs text-gray-400">SKU: {selectedVariant.sku}</span>
            )}
            {selectedVariant.expiresAt && !isNaN(new Date(selectedVariant.expiresAt).getTime()) && (
              <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                <Calendar className="w-3 h-3" />
                Exp: {new Date(selectedVariant.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VariantSelector;
