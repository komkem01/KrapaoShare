export interface PaginatedMeta {
  page?: number;
  limit?: number;
  offset?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginatedPayload<T> {
  items?: T[];
  meta?: PaginatedMeta;
  [key: string]: unknown;
}

export interface NormalizedList<T> {
  items: T[];
  meta?: PaginatedMeta;
}

/**
 * Normalize API responses that may either be a bare array or a paginated object with `items` + `meta`.
 */
export function normalizeListResponse<T>(payload?: T[] | PaginatedPayload<T> | null): NormalizedList<T> {
  if (!payload) {
    return { items: [] };
  }

  if (Array.isArray(payload)) {
    return { items: payload };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  return { items, meta: payload.meta };
}
