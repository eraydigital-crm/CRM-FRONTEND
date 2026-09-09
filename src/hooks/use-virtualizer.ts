import { useState, useLayoutEffect } from "react";

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

export interface UseVirtualizerOptions {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
}

export function useVirtualizer({
  count,
  getScrollElement,
  estimateSize,
  overscan = 8,
}: UseVirtualizerOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const scrollElement = getScrollElement();

  useLayoutEffect(() => {
    if (!scrollElement) return;

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(scrollElement.clientHeight || 600);
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    // Initial size
    handleResize();

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [scrollElement]);

  const size = estimateSize(0);
  const totalSize = count * size;

  const startNode = Math.max(0, Math.floor(scrollTop / size) - overscan);
  const endNode = Math.min(count - 1, Math.ceil((scrollTop + containerHeight) / size) + overscan);

  const virtualItems: VirtualItem[] = [];
  for (let i = startNode; i <= endNode; i++) {
    virtualItems.push({
      index: i,
      start: i * size,
      size,
    });
  }

  return {
    getVirtualItems: () => virtualItems,
    getTotalSize: () => totalSize,
  };
}
