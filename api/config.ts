import type { ApiRequest, ApiResponse } from "../server/http.js";
import { publicConfig } from "../server/config.js";

export default function handler(_req: ApiRequest, res: ApiResponse) {
  return res.status(200).json(publicConfig());
}
