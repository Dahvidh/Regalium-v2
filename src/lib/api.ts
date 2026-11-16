type ApiResult<T = unknown> = { data: T };

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null) as T | null;
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : `API request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status?: number; data?: T | null };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return { data: data as T };
}

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body: unknown) => request<T>("POST", path, body),
};
