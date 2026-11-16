import type { ApiRequest, ApiResponse } from "../../_lib/http";
import { errorResponse, methodNotAllowed, queryString } from "../../_lib/http";
import { isWalletAddress } from "../../_lib/blockchain";
import { getWalletPurchases } from "../../_lib/purchases";

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
