import { useMemo } from "react";

export interface FilteredCollectionOptions<T> {
  search: string;
  searchFields: (keyof T)[];
  filters?: ((item: T) => boolean)[];
  sort?: (a: T, b: T) => number;
}

export function useFilteredCollection<T>(
  items: T[],
  options: FilteredCollectionOptions<T>
): T[] {
  return useMemo(() => {
    const normalizedSearch = options.search.trim().toLowerCase();
    let result = items;

    // 1. Filter by search fields
    if (normalizedSearch && options.searchFields.length > 0) {
      result = result.filter((item) =>
        options.searchFields.some((field) => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(normalizedSearch);
        })
      );
    }

    // 2. Apply additional filters
    if (options.filters && options.filters.length > 0) {
      for (const filterFn of options.filters) {
        result = result.filter(filterFn);
      }
    }

    // 3. Sort
    if (options.sort) {
      result = [...result].sort(options.sort);
    }

    return result;
  }, [items, options.search, options.searchFields, options.filters, options.sort]);
}
