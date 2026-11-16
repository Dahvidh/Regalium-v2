import type { ApiRequest, ApiResponse } from "../_lib/http";
import { errorResponse, methodNotAllowed, queryString } from "../_lib/http";
import { decimalToWei, getPresaleRate } from "../_lib/blockchain";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const pol = queryString(req.query.pol);
  const polWei = decimalToWei(pol);
  if (!polWei || polWei <= 0n) return errorResponse(res, "A positive POL amount with up to 18 decimal places is required.", 400);
  try {
    const rate = await getPresaleRate();
    if (rate <= 0n) return errorResponse(res, "The presale contract did not return a valid rate.", 503);
    return res.status(200).json({
      pol,
      rateRglmPerPolRaw: rate.toString(),
      rglmRaw: (polWei * rate / 10n ** 18n).toString(),
      decimals: 18,
      source: "presale-contract",
    });
  } catch (cause) {
    console.error("Presale quote failed", cause);
    return errorResponse(res, "Unable to read the current presale rate from the contract.", 502);
  }
}
