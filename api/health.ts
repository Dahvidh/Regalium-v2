import type { ApiRequest, ApiResponse } from "../server/http.js";
import { checkDatabase } from "../server/health.js";

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  try {
    await checkDatabase();
    return res.status(200).json({ status: "ok", service: "regalium-backend", database: "online" });
  } catch (cause) {
    console.error("Regalium health check failed", cause);
    return res.status(503).json({ status: "degraded", service: "regalium-backend", database: "offline" });
  }
}
