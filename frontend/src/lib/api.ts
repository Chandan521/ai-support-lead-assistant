const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
}

export function getAdminHeaders(adminToken: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = adminToken.trim();

  if (token) {
    headers['X-Admin-Key'] = token;
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: RequestMethod;
    body?: Record<string, unknown> | null;
    adminToken?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const requestHeaders: Record<string, string> = {
    ...(options.headers || {}),
    ...(options.adminToken ? getAdminHeaders(options.adminToken) : {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers: requestHeaders,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to reach the API at ${getApiBaseUrl()}. Confirm Laravel is running and that CORS allows this frontend origin.`,
        { cause: error },
      );
    }

    throw error;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      (payload && typeof payload === 'string' ? payload : 'Request failed.');
    throw new Error(message || 'Request failed.');
  }

  return payload as T;
}
