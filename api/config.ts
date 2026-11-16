import type { ApiRequest, ApiResponse } from "./_lib/http";
import { publicConfig } from "./_lib/config";

export default function handler(_req: ApiRequest, res: ApiResponse) {
  return res.status(200).json(publicConfig());
}
