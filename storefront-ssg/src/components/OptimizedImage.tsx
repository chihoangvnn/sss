import React from 'react';
import { getOptimizedImageUrl } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: 'auto' | number;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 'auto',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  // Generate optimized URLs for different sizes
  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'auto', // Cloudinary will choose WebP/AVIF automatically
  });

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;
    
    const sizes = [0.5, 1, 1.5, 2]; // Different pixel densities
    return sizes
      .map(scale => {
        const scaledWidth = Math.round(width * scale);
        const url = getOptimizedImageUrl(src, {
          width: scaledWidth,
          height: height ? Math.round(height * scale) : undefined,
          quality,
          format: 'auto',
        });
        return `${url} ${scale}x`;
      })
      .join(', ');
  };

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      srcSet={generateSrcSet()}
      sizes={sizes}
      style={{
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}