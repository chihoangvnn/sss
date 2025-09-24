import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Scale, Package, Plus, Minus } from 'lucide-react';

interface DecimalQuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  unitType: 'weight' | 'count' | 'volume';
  unit: string;
  allowDecimals: boolean;
  minQuantity?: number;
  quantityStep?: number;
  maxQuantity?: number;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DecimalQuantityInput({
  value,
  onChange,
  unitType,
  unit,
  allowDecimals,
  minQuantity = 0.001,
  quantityStep = 1.0,
  maxQuantity,
  className,
  disabled = false,
  size = 'md'
}: DecimalQuantityInputProps) {
  const [inputValue, setInputValue] = useState(formatQuantity(value, allowDecimals));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format quantity based on unit type
  function formatQuantity(qty: number, useDecimals: boolean): string {
    if (useDecimals) {
      return qty.toFixed(3);
    }
    return Math.floor(qty).toString();
  }

  // Parse input value, supporting both "." and "," as decimal separators
  function parseQuantity(input: string): number {
    // Replace Vietnamese decimal separator with standard
    const normalizedInput = input.replace(',', '.');
    
    // Remove leading zeros but preserve valid decimals like "0.5"
    const cleanInput = normalizedInput.replace(/^0+(?=\d)/, '');
    
    const parsed = parseFloat(cleanInput || '0');
    return isNaN(parsed) ? 0 : parsed;
  }

  // Validate and format input
  function validateAndFormat(input: string): { isValid: boolean; formatted: string; value: number } {
    const parsed = parseQuantity(input);
    
    // Check minimum quantity
    if (parsed < minQuantity) {
      return { isValid: false, formatted: input, value: parsed };
    }
    
    // Check maximum quantity
    if (maxQuantity && parsed > maxQuantity) {
      return { isValid: false, formatted: input, value: parsed };
    }
    
    // Format based on decimal support
    const formatted = formatQuantity(parsed, allowDecimals);
    return { isValid: true, formatted, value: parsed };
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow typing decimals and commas
    if (allowDecimals) {
      // Allow digits, one decimal point, and comma
      if (!/^[\d,\.]*$/.test(newValue)) return;
      
      // Prevent multiple decimal points
      const normalizedValue = newValue.replace(',', '.');
      if ((normalizedValue.match(/\./g) || []).length > 1) return;
      
      // Limit to 3 decimal places
      const parts = normalizedValue.split('.');
      if (parts[1] && parts[1].length > 3) return;
    } else {
      // Only allow integers for count-based products
      if (!/^\d*$/.test(newValue)) return;
    }
    
    setInputValue(newValue);
  };

  // Handle input blur (auto-format)
  const handleBlur = () => {
    setIsFocused(false);
    const { isValid, formatted, value: parsedValue } = validateAndFormat(inputValue);
    
    if (isValid) {
      setInputValue(formatted);
      if (parsedValue !== value) {
        onChange(parsedValue);
      }
    } else {
      // Revert to previous valid value
      setInputValue(formatQuantity(value, allowDecimals));
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    // Select all text for easy editing
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  // Handle increment/decrement
  const handleAdjust = (increment: number) => {
    const newValue = Math.max(minQuantity, value + increment);
    const finalValue = maxQuantity ? Math.min(newValue, maxQuantity) : newValue;
    
    onChange(finalValue);
    setInputValue(formatQuantity(finalValue, allowDecimals));
  };

  // Quick increment buttons for weight-based products
  const getQuickButtons = () => {
    if (!allowDecimals || unitType !== 'weight') return [];
    
    const buttons = [];
    if (unit === 'kg') {
      buttons.push({ label: '+0.1kg', value: 0.1 });
      buttons.push({ label: '+0.5kg', value: 0.5 });
      buttons.push({ label: '+1kg', value: 1.0 });
    } else if (unit === 'gram') {
      buttons.push({ label: '+10g', value: 10 });
      buttons.push({ label: '+50g', value: 50 });
      buttons.push({ label: '+100g', value: 100 });
    }
    
    return buttons;
  };

  // Update input value when props change
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatQuantity(value, allowDecimals));
    }
  }, [value, allowDecimals, isFocused]);

  // Get icon based on unit type
  const getIcon = () => {
    switch (unitType) {
      case 'weight':
        return <Scale className="h-4 w-4" />;
      case 'volume':
        return <Scale className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Get size classes
  const sizeClasses = {
    sm: 'text-sm h-8',
    md: 'text-base h-10',
    lg: 'text-lg h-12'
  };

  const quickButtons = getQuickButtons();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main quantity input */}
      <div className="flex items-center space-x-2">
        {/* Decrease button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAdjust(-quantityStep)}
          disabled={disabled || value <= minQuantity}
          className={cn(
            'flex-shrink-0 w-8 h-8 p-0',
            allowDecimals && 'border-orange-200 hover:bg-orange-50'
          )}
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Quantity input with unit display */}
        <div className="relative flex-1">
          <div className="flex items-center">
            {/* Icon */}
            <div className={cn(
              'absolute left-3 z-10',
              allowDecimals ? 'text-orange-500' : 'text-gray-400'
            )}>
              {getIcon()}
            </div>
            
            {/* Input */}
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              className={cn(
                sizeClasses[size],
                'pl-10 pr-16 text-center font-semibold',
                allowDecimals && 'border-orange-200 focus:border-orange-400 focus:ring-orange-200',
                isFocused && allowDecimals && 'ring-2 ring-orange-200'
              )}
              placeholder={allowDecimals ? '0.000' : '0'}
            />
            
            {/* Unit badge */}
            <Badge 
              variant="outline" 
              className={cn(
                'absolute right-2 text-xs px-2 py-1',
                allowDecimals ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600'
              )}
            >
              {unit}
            </Badge>
          </div>
        </div>

        {/* Increase button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAdjust(quantityStep)}
          disabled={disabled || Boolean(maxQuantity && value >= maxQuantity)}
          className={cn(
            'flex-shrink-0 w-8 h-8 p-0',
            allowDecimals && 'border-orange-200 hover:bg-orange-50'
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick increment buttons for weight-based products */}
      {quickButtons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quickButtons.map((button) => (
            <Button
              key={button.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAdjust(button.value)}
              disabled={disabled}
              className="text-xs px-2 py-1 h-6 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              {button.label}
            </Button>
          ))}
        </div>
      )}

      {/* Validation message */}
      {inputValue && !validateAndFormat(inputValue).isValid && (
        <div className="text-xs text-red-600">
          {parseQuantity(inputValue) < minQuantity 
            ? `Số lượng tối thiểu: ${formatQuantity(minQuantity, allowDecimals)} ${unit}`
            : maxQuantity && parseQuantity(inputValue) > maxQuantity
            ? `Số lượng tối đa: ${formatQuantity(maxQuantity, allowDecimals)} ${unit}`
            : 'Định dạng không hợp lệ'
          }
        </div>
      )}
    </div>
  );
}

export default DecimalQuantityInput;