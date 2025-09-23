import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';

interface VirtualizedListOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualizedListItem<T> {
  data: T;
  index: number;
  isVisible: boolean;
  top: number;
  height: number;
}

export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
): VirtualizedListReturn<T> {
  const { itemHeight, overscan = 5, containerHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

    return { startIndex, endIndex, visibleStart, visibleEnd };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const result: VirtualizedItem<T>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        data: items[i],
        index: i,
        isVisible: i >= visibleRange.visibleStart && i <= visibleRange.visibleEnd,
        top: i * itemHeight,
        height: itemHeight,
      });
    }

    return result;
  }, [items, visibleRange, itemHeight]);

  // Total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // Scroll handler with performance optimization
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    // Performance tracking in development
    if (import.meta.env.DEV) {
      const visibleCount = visibleRange.endIndex - visibleRange.startIndex + 1;
      console.log(`📋 Virtualized list: showing ${visibleCount}/${items.length} items`);
    }
  }, [visibleRange, items.length]);

  // Scroll to item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;

    const itemTop = index * itemHeight;
    let scrollTop = itemTop;

    if (align === 'center') {
      scrollTop = itemTop - (containerHeight - itemHeight) / 2;
    } else if (align === 'end') {
      scrollTop = itemTop - containerHeight + itemHeight;
    }

    scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight));
    containerRef.current.scrollTop = scrollTop;
  }, [itemHeight, containerHeight, totalHeight]);

  // Get item at index
  const getItemAt = useCallback((index: number) => {
    return items[index];
  }, [items]);

  const isVirtualized = items.length > Math.ceil(containerHeight / itemHeight) + overscan * 2;

  return {
    containerRef,
    virtualItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollToItem,
    getItemAt,
    visibleRange,
    isVirtualized,
  };
}

// Optimized list component wrapper
export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  className = '',
  onScroll,
}: VirtualizedListProps<T>) {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    offsetY,
    handleScroll: internalHandleScroll,
    scrollToItem,
    getItemAt,
    visibleRange,
    isVirtualized,
  } = useVirtualizedList(items, { itemHeight, overscan, containerHeight });

  // Combined scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    internalHandleScroll(e);
    onScroll?.(e.currentTarget.scrollTop);
  }, [internalHandleScroll, onScroll]);

  // Simple non-virtualized rendering for small lists  
  if (!isVirtualized) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index, true))}
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {virtualItems.map((virtualItem) => 
            renderItem(virtualItem.data, virtualItem.index, virtualItem.isVisible)
          )}
        </div>
      </div>
    </div>
  );
}