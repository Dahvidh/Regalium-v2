import type { ApiRequest, ApiResponse } from "../../server/http";
import { errorResponse, methodNotAllowed } from "../../server/http";
import { isTransactionHash, isWalletAddress, verifyTransaction } from "../../server/blockchain";
import { saveVerifiedPurchase } from "../../server/purchases";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const input = req.body as { txHash?: unknown; walletAddress?: unknown } | undefined;
  if (!input || !isTransactionHash(input.txHash)) return errorResponse(res, "A valid transaction hash is required.", 400);
  if (!isWalletAddress(input.walletAddress)) return errorResponse(res, "A valid wallet address is required.", 400);

  try {
    const result = await verifyTransaction(input.txHash, input.walletAddress);
    if (!result.found) return errorResponse(res, "Transaction not found on Polygon Amoy.", 404);
    if (!result.confirmed) return res.status(200).json({ verified: false, pending: true, result });
    if (!result.successful) return res.status(200).json({ verified: false, pending: false, failed: true, result });
    if (!result.fromMatches || !result.toMatches) {
      return errorResponse(res, "Transaction does not match the connected wallet and Regalium presale contract.", 422);
    }
    if (!result.rglmTransfer || BigInt(result.rglmTransfer.amountRaw) <= 0n) {
      return errorResponse(res, "Transaction succeeded, but no valid RGLM transfer to the connected wallet was found.", 422);
    }

    await saveVerifiedPurchase({
      txHash: input.txHash,
      walletAddress: input.walletAddress,
      valueWei: BigInt(result.valueWei).toString(),
      rglmAmountRaw: result.rglmTransfer.amountRaw,
      blockNumber: result.blockNumber ? BigInt(result.blockNumber).toString() : null,
    });
    return res.status(200).json({ verified: true, pending: false, result });
  } catch (cause) {
    console.error("Presale verification failed", cause);
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("different wallet")) return errorResponse(res, message, 409);
    return errorResponse(res, "Unable to verify or persist the purchase right now.", 502);
  }
}
