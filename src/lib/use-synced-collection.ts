/**
 * Server-backed collection with a `useState`-shaped API.
 *
 * The screens of this app manipulate whole arrays (`setClients([new, ...clients])`,
 * `setProjects(projects.map(...))`). This hook keeps that ergonomics but makes
 * every change durable: it compares the array you set with the previous one and
 * turns the difference into create / update / delete calls on the API.
 *
 * The local state is updated first (optimistic), then reconciled with whatever
 * the server returns; a failed write raises a toast and refetches, so the UI
 * never silently drifts from the database.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/http";

export type Identified = { id: string };

export type SyncAdapter<T extends Identified> = {
  /** React Query key and diagnostics label. */
  key: string;
  /** Used in error toasts: "Impossible de créer le client". */
  labels: { create: string; update: string; remove: string };
  fetch: (signal?: AbortSignal) => Promise<T[]>;
  create?: (item: T) => Promise<T>;
  update?: (next: T, previous: T) => Promise<T>;
  remove?: (item: T) => Promise<void>;
};

export type SyncedCollection<T extends Identified> = {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
};

function describe(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.firstFieldError ?? error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function sameItem<T extends Identified>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useSyncedCollection<T extends Identified>(
  adapter: SyncAdapter<T>,
  enabled: boolean,
): SyncedCollection<T> {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [adapter.key],
    queryFn: ({ signal }) => adapter.fetch(signal),
    enabled,
    staleTime: 30_000,
  });

  const [items, setLocalItems] = useState<T[]>([]);
  const itemsRef = useRef<T[]>([]);
  const pendingRef = useRef(0);
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  const commit = useCallback((next: T[]) => {
    itemsRef.current = next;
    setLocalItems(next);
  }, []);

  // Server data wins whenever nothing local is in flight.
  useEffect(() => {
    if (!query.data || pendingRef.current > 0) return;
    if (JSON.stringify(query.data) === JSON.stringify(itemsRef.current)) return;
    commit(query.data);
  }, [query.data, commit]);

  const settle = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (pendingRef.current === 0) {
      void queryClient.invalidateQueries({ queryKey: [adapter.key] });
    }
  }, [queryClient, adapter.key]);

  /** Swaps the optimistic item (temporary id) for the one the server created. */
  const replaceItem = useCallback(
    (temporaryId: string, serverItem: T) => {
      commit(itemsRef.current.map((item) => (item.id === temporaryId ? serverItem : item)));
    },
    [commit],
  );

  const persist = useCallback(
    (previous: T[], next: T[]) => {
      const current = adapterRef.current;
      const previousById = new Map(previous.map((item) => [item.id, item]));
      const nextById = new Map(next.map((item) => [item.id, item]));

      const created = next.filter((item) => !previousById.has(item.id));
      const removed = previous.filter((item) => !nextById.has(item.id));
      const updated = next.filter((item) => {
        const before = previousById.get(item.id);
        return before !== undefined && !sameItem(before, item);
      });

      for (const item of created) {
        if (!current.create) continue;
        pendingRef.current += 1;
        current.create(item)
          .then((serverItem) => replaceItem(item.id, serverItem))
          .catch((error) => {
            toast.error(current.labels.create, { description: describe(error, current.labels.create) });
          })
          .finally(settle);
      }

      for (const item of updated) {
        if (!current.update) continue;
        const before = previousById.get(item.id)!;
        pendingRef.current += 1;
        current.update(item, before)
          .then((serverItem) => replaceItem(item.id, serverItem))
          .catch((error) => {
            toast.error(current.labels.update, { description: describe(error, current.labels.update) });
          })
          .finally(settle);
      }

      for (const item of removed) {
        if (!current.remove) continue;
        pendingRef.current += 1;
        current.remove(item)
          .catch((error) => {
            toast.error(current.labels.remove, { description: describe(error, current.labels.remove) });
          })
          .finally(settle);
      }
    },
    [replaceItem, settle],
  );

  const setItems = useCallback<Dispatch<SetStateAction<T[]>>>(
    (value) => {
      const previous = itemsRef.current;
      const next = typeof value === "function" ? (value as (prev: T[]) => T[])(previous) : value;
      if (next === previous) return;
      commit(next);
      persist(previous, next);
    },
    [commit, persist],
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [adapter.key] });
  }, [queryClient, adapter.key]);

  return {
    items,
    setItems,
    isLoading: enabled && query.isLoading,
    error: query.error,
    refresh,
  };
}

/** Temporary client-side id, replaced by the server id once created. */
export function isTemporaryId(id: string): boolean {
  return !/^\d+$/.test(id);
}

export function numericId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}
