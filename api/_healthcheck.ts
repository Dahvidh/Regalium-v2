import type { ApiRequest, ApiResponse } from "./_lib/http";
import { checkDatabase } from "./_lib/health";

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  try {
    await checkDatabase();
    return res.status(200).json({ status: "ok", service: "regalium-backend", database: "online" });
  } catch (cause) {
    console.error("Regalium health check failed", cause);
    return res.status(503).json({ status: "degraded", service: "regalium-backend", database: "offline" });
  }
}
