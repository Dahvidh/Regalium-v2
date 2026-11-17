import type { ApiRequest, ApiResponse } from "../server/http";
import { publicConfig } from "../server/config";

export default function handler(_req: ApiRequest, res: ApiResponse) {
  return res.status(200).json(publicConfig());
}
