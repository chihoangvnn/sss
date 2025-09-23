import React, { useState, useRef, useEffect } from 'react';
import { 
  getOptimizedImageUrl, 
  generateResponsiveImageSources, 
  generateBlurPlaceholder 
} from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad';
  gravity?: 'auto' | 'face' | 'faces' | 'center' | 'north' | 'south' | 'east' | 'west';
  sizes?: string;
  enableBlurPlaceholder?: boolean;
  enableLazyLoading?: boolean;
  enableResponsive?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 'auto:good',
  crop = 'fill',
  gravity = 'auto',
  sizes,
  enableBlurPlaceholder = true,
  enableLazyLoading = !priority,
  enableResponsive = true,
  fallbackSrc = '/placeholder-image.jpg',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!enableLazyLoading || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [enableLazyLoading, priority, isInView]);

  // Generate optimized URLs
  const mainImageUrl = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    crop,
    gravity,
    format: 'auto',
    dpr: 'auto',
    progressive: true,
  });

  const blurPlaceholderUrl = enableBlurPlaceholder 
    ? generateBlurPlaceholder(src, 10) 
    : null;

  const responsiveImageData = enableResponsive && width 
    ? generateResponsiveImageSources(src, [
        { width: Math.round(width * 0.5), maxWidth: '480px' },
        { width: Math.round(width * 0.75), maxWidth: '768px' },
        { width: width, maxWidth: '1024px' },
        { width: Math.round(width * 1.25), maxWidth: '1280px' },
        { width: Math.round(width * 1.5) }
      ])
    : null;

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  const shouldShowImage = isInView && !isError;
  const imageSrc = isError ? fallbackSrc : mainImageUrl;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Blur placeholder background */}
      {enableBlurPlaceholder && blurPlaceholderUrl && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
          style={{
            backgroundImage: `url(${blurPlaceholderUrl})`,
            filter: 'blur(5px)',
            transform: 'scale(1.1)', // Slightly larger to hide blur edges
          }}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !enableBlurPlaceholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
        </div>
      )}

      {/* Main image */}
      {shouldShowImage && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          srcSet={responsiveImageData?.srcSet}
          sizes={sizes || responsiveImageData?.sizes || '100vw'}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover transition-all duration-500 ease-out
            ${isLoaded 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-105'
            }
          `}
          style={{
            filter: isLoaded ? 'none' : 'blur(2px)',
          }}
        />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg 
              className="w-12 h-12 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-sm">Không thể tải hình ảnh</p>
          </div>
        </div>
      )}

      {/* Loading indicator for priority images */}
      {priority && !isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases

interface HeroImageProps extends Omit<OptimizedImageProps, 'priority' | 'enableLazyLoading'> {
  overlayOpacity?: number;
  overlayColor?: string;
}

export function HeroImage({ 
  overlayOpacity = 0.3, 
  overlayColor = 'black',
  className = '',
  ...props 
}: HeroImageProps) {
  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        {...props}
        priority={true}
        enableLazyLoading={false}
        quality="auto:best"
        className="w-full h-full"
      />
      {overlayOpacity > 0 && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}
    </div>
  );
}

interface ProductImageProps extends Omit<OptimizedImageProps, 'crop' | 'gravity'> {
  showZoomOnHover?: boolean;
}

export function ProductImage({ 
  showZoomOnHover = true, 
  className = '',
  ...props 
}: ProductImageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden ${className} ${showZoomOnHover ? 'cursor-zoom-in' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <OptimizedImage
        {...props}
        crop="fill"
        gravity="auto"
        className={`
          w-full h-full transition-transform duration-300 ease-out
          ${isHovered && showZoomOnHover ? 'scale-110' : 'scale-100'}
        `}
      />
    </div>
  );
}