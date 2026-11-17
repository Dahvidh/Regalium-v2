export type ApiRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type ApiResponse = {
  status(code: number): ApiResponse;
  json(value: unknown): void;
  setHeader(name: string, value: string): void;
};

export function methodNotAllowed(res: ApiResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  return res.status(405).json({ error: "Method not allowed." });
}

export function errorResponse(res: ApiResponse, message: string, status = 400) {
  return res.status(status).json({ error: message });
}

export function queryString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}
