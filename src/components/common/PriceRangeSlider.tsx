import { useState, memo, useRef } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  initialMin?: number;
  initialMax?: number;
  onChange: (min: number, max: number) => void;
}

export const PriceRangeSlider = memo(function PriceRangeSlider({
  min,
  max,
  step = 100,
  initialMin,
  initialMax,
  onChange,
}: PriceRangeSliderProps) {
  const [minValue, setMinValue] = useState(initialMin ?? min);
  const [maxValue, setMaxValue] = useState(initialMax ?? max);
  const [isDragging, setIsDragging] = useState(false);
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, maxValue - step);
    setMinValue(newMin);
    if (!isDragging) {
      onChange(newMin, maxValue);
    }
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, minValue + step);
    setMaxValue(newMax);
    if (!isDragging) {
      onChange(minValue, newMax);
    }
  };

  const handleMinDragEnd = () => {
    setIsDragging(false);
    onChange(minValue, maxValue);
  };

  const handleMaxDragEnd = () => {
    setIsDragging(false);
    onChange(minValue, maxValue);
  };

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="mt-3">
      <div className="relative h-2 mb-6">
        {/* Track background */}
        <div className="absolute w-full h-1 bg-gray-200 rounded-full" />
        
        {/* Active track */}
        <div
          className="absolute h-1 bg-primary-600 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min slider */}
        <input
          ref={minInputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleMinDragEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleMinDragEnd}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-10
            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-600
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none 
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-600
            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Max slider */}
        <input
          ref={maxInputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleMaxDragEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleMaxDragEnd}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-10
            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-600
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none 
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-600
            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Price labels */}
      <div className="flex items-center justify-between text-sm">
        <span className="px-3 py-1.5 bg-gray-100 rounded-lg font-medium text-gray-700">
          ₹{minValue.toLocaleString()}
        </span>
        <span className="text-gray-400">-</span>
        <span className="px-3 py-1.5 bg-gray-100 rounded-lg font-medium text-gray-700">
          ₹{maxValue.toLocaleString()}
        </span>
      </div>
    </div>
  );
});
