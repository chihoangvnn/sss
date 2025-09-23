import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format price with VND currency
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(numPrice);
}

// Validate Vietnamese phone number
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate optimized Cloudinary URL with advanced transformations
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    dpr?: 'auto' | number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad';
    gravity?: 'auto' | 'face' | 'faces' | 'center' | 'north' | 'south' | 'east' | 'west';
    blur?: number;
    progressive?: boolean;
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { 
    width, 
    height, 
    quality = 'auto:good', 
    format = 'auto', 
    dpr = 'auto',
    crop = 'fill',
    gravity = 'auto',
    blur,
    progressive = true
  } = options;
  
  // Parse Cloudinary URL and inject transformations
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) return url;

  const transformations = [];
  
  // Size transformations
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);
  
  // Gravity (smart cropping)
  if (gravity && crop === 'fill') transformations.push(`g_${gravity}`);
  
  // Device pixel ratio for retina displays
  transformations.push(`dpr_${dpr}`);
  
  // Quality optimization
  transformations.push(`q_${quality}`);
  
  // Format optimization (WebP/AVIF with fallback)
  transformations.push(`f_${format}`);
  
  // Progressive loading
  if (progressive && (format === 'auto' || format === 'jpg')) {
    transformations.push('fl_progressive');
  }
  
  // Blur for placeholder
  if (blur) transformations.push(`e_blur:${blur}`);

  const transformationString = transformations.join(',');
  
  return `${urlParts[0]}/upload/${transformationString}/${urlParts[1]}`;
}

// Generate responsive image sources for different screen sizes
export function generateResponsiveImageSources(
  url: string,
  breakpoints: { width: number; maxWidth?: string }[] = [
    { width: 640, maxWidth: '640px' },
    { width: 768, maxWidth: '768px' },
    { width: 1024, maxWidth: '1024px' },
    { width: 1280, maxWidth: '1280px' },
    { width: 1536 }
  ]
): { srcSet: string; sizes: string } {
  const srcSet = breakpoints
    .map(bp => {
      const optimizedUrl = getOptimizedImageUrl(url, {
        width: bp.width,
        quality: 'auto:good',
        format: 'auto',
        dpr: 'auto'
      });
      return `${optimizedUrl} ${bp.width}w`;
    })
    .join(', ');

  const sizes = breakpoints
    .filter(bp => bp.maxWidth)
    .map(bp => `(max-width: ${bp.maxWidth}) ${bp.width}px`)
    .concat(['100vw'])
    .join(', ');

  return { srcSet, sizes };
}

// Generate blur placeholder for progressive loading
export function generateBlurPlaceholder(url: string, quality: number = 20): string {
  return getOptimizedImageUrl(url, {
    width: 40,
    height: 40,
    quality: quality,
    blur: 1000,
    format: 'jpg'
  });
}

// Color utility functions for theme customization
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function generateColorShades(primaryColor: string): Record<string, string> {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return {};

  return {
    50: `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)})`,
    100: `rgb(${Math.min(255, rgb.r + 30)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 30)})`,
    200: `rgb(${Math.min(255, rgb.r + 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 20)})`,
    300: `rgb(${Math.min(255, rgb.r + 10)}, ${Math.min(255, rgb.g + 10)}, ${Math.min(255, rgb.b + 10)})`,
    400: primaryColor,
    500: `rgb(${Math.max(0, rgb.r - 10)}, ${Math.max(0, rgb.g - 10)}, ${Math.max(0, rgb.b - 10)})`,
    600: `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`,
    700: `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`,
    800: `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`,
    900: `rgb(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)})`,
  };
}

// Debounce function for form inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Generate session ID for tracking
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}