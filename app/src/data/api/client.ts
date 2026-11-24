export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current Firebase ID token, or null when signed out. */
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  fetchImpl?: typeof fetch;
}

interface ErrorBody {
  error?: { code?: string; message?: string };
  requestId?: string;
}

/** Fetch wrapper: attaches the ID token, refreshes it once on 401, and normalizes errors. */
export function createApiClient({
  baseUrl,
  getToken,
  fetchImpl = fetch,
}: ApiClientOptions): ApiClient {
  async function send(method: string, path: string, body: unknown, forceRefresh: boolean) {
    const token = await getToken(forceRefresh);
    if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Not signed in.");

    try {
      return await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new ApiError(0, "NETWORK", "Couldn't reach the server.");
    }
  }

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let response = await send(method, path, body, false);
    if (response.status === 401) response = await send(method, path, body, true);

    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const { error, requestId } = (payload ?? {}) as ErrorBody;
      throw new ApiError(
        response.status,
        error?.code ?? "UNKNOWN",
        error?.message ?? "Request failed.",
        requestId,
      );
    }
    return payload as T;
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    put: (path, body) => request("PUT", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path) => request("DELETE", path),
  };
}
