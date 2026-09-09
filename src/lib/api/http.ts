/**
 * Thin fetch wrapper around the Symfony API (CGA-BACKEND).
 *
 * Every /api/* response uses the same envelope:
 *   { success, data, message, errors }
 *
 * Authentication supports both modes the backend offers:
 *  - same-origin (front served by Symfony, or through the Vite dev proxy):
 *    the JWT lives in the HttpOnly `eray_token` cookie and we only have to
 *    echo the `eray_csrf` cookie back in the X-CSRF-Token header;
 *  - cross-origin (front deployed separately, VITE_API_BASE_URL set): the JWT
 *    returned by /api/auth/login is stored client-side and sent as a Bearer
 *    token, since SameSite=Strict cookies are never attached cross-site.
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const NAME_KEY = "name";

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldErrors;

  constructor(status: number, message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** First validation message, useful as a toast description. */
  get firstFieldError(): string | undefined {
    for (const messages of Object.values(this.errors)) {
      if (messages?.length) return messages[0];
    }
    return undefined;
  }
}

export function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * The token lives in localStorage when "remember me" was checked, in
 * sessionStorage otherwise - both are read back, so a session survives a
 * reload exactly as long as the user asked for.
 */
export const session = {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  },
  get role(): string | null {
    return localStorage.getItem(ROLE_KEY) ?? sessionStorage.getItem(ROLE_KEY);
  },
  get name(): string | null {
    return localStorage.getItem(NAME_KEY) ?? sessionStorage.getItem(NAME_KEY);
  },
  save(values: { token: string; role: string; name: string }, remember: boolean) {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(TOKEN_KEY);
    store.setItem(TOKEN_KEY, values.token);
    store.setItem(ROLE_KEY, values.role);
    store.setItem(NAME_KEY, values.name);
  },
  patch(values: Partial<{ role: string; name: string }>) {
    const store = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    if (values.role !== undefined) store.setItem(ROLE_KEY, values.role);
    if (values.name !== undefined) store.setItem(NAME_KEY, values.name);
  },
  clear() {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(ROLE_KEY);
      store.removeItem(NAME_KEY);
    }
  },
  /** True when a same-origin cookie session is active (flag set by the backend). */
  get hasCookieSession(): boolean {
    return readCookie("eray_auth") === "1";
  },
  get isAuthenticated(): boolean {
    return Boolean(this.token) || this.hasCookieSession;
  },
};

export type QueryValue = string | number | boolean | undefined | null | Array<string | number>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(`${key}[]`, String(item));
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function normalizeErrors(raw: unknown): FieldErrors {
  if (!raw || typeof raw !== "object") return {};
  if (Array.isArray(raw)) {
    return raw.length ? { _: raw.map(String) } : {};
  }
  const out: FieldErrors = {};
  for (const [field, messages] of Object.entries(raw as Record<string, unknown>)) {
    out[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)];
  }
  return out;
}

/** Fired when the API rejects the session, so the app can bounce to /login. */
export const UNAUTHORIZED_EVENT = "eray:unauthorized";

function defaultMessageFor(status: number): string {
  switch (status) {
    case 403:
      return "Vous n'avez pas les droits necessaires pour cette action.";
    case 404:
      return "Ressource introuvable.";
    case 429:
      return "Trop de requetes. Merci de patienter un instant.";
    default:
      return status >= 500 ? "Erreur serveur. Reessayez plus tard." : "La requete a echoue.";
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = session.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  // Double-submit CSRF: only meaningful for the cookie-carried JWT - the
  // backend skips the check for Bearer requests.
  if (!token && method !== "GET") {
    const csrf = readCookie("eray_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: "include",
      signal,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new ApiError(0, "Impossible de joindre le serveur. Verifiez que l'API est demarree.");
  }

  let payload: { success?: boolean; data?: unknown; message?: string | null; errors?: unknown } | null = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      session.clear();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      response.status,
      payload?.message || defaultMessageFor(response.status),
      normalizeErrors(payload?.errors),
    );
  }

  return (payload?.data ?? null) as T;
}

export type Paginated<T> = {
  items: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
};

const MAX_PER_PAGE = 100; // backend cap - see Service/Pagination/Paginator
const MAX_PAGES = 20; // safety net: never pull more than 2000 rows into the store

/** Walks every page of a paginated endpoint and returns the flattened list. */
export async function fetchAllPages<T>(
  path: string,
  query: Record<string, QueryValue> = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await apiRequest<Paginated<T>>(path, {
      query: { ...query, page, perPage: MAX_PER_PAGE },
      signal,
    });
    all.push(...(result?.items ?? []));
    if (!result?.meta || page >= result.meta.totalPages) break;
  }
  return all;
}
