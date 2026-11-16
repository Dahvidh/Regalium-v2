import type { ApiRequest, ApiResponse } from "../../../server/http";
import { errorResponse, methodNotAllowed, queryString } from "../../../server/http";
import { isWalletAddress } from "../../../server/blockchain";
import { getWalletPurchases } from "../../../server/purchases";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const wallet = queryString(req.query.wallet);
  if (!isWalletAddress(wallet)) return errorResponse(res, "Invalid wallet address.", 400);
  try {
    const items = await getWalletPurchases(wallet);
    return res.status(200).json({ walletAddress: wallet.toLowerCase(), items });
  } catch (cause) {
    console.error("Purchase history lookup failed", cause);
    return errorResponse(res, "Unable to load purchase history.", 500);
  }
}
