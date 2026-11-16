import type { ApiRequest, ApiResponse } from "../_lib/http";
import { errorResponse, methodNotAllowed, queryString } from "../_lib/http";
import { isTransactionHash, verifyTransaction } from "../_lib/blockchain";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const hash = queryString(req.query.hash);
  if (!isTransactionHash(hash)) return errorResponse(res, "Invalid transaction hash.", 400);
  try {
    return res.status(200).json(await verifyTransaction(hash));
  } catch (cause) {
    console.error("Transaction lookup failed", cause);
    return errorResponse(res, "Unable to query Polygon Amoy right now.", 502);
  }
}
