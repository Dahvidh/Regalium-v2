import { getSql } from "./db.js";

export async function saveVerifiedPurchase(input: {
  txHash: string;
  walletAddress: string;
  valueWei: string;
  rglmAmountRaw: string;
  blockNumber: string | null;
}) {
  const sql = getSql();
  const wallet = input.walletAddress.toLowerCase();
  const txHash = input.txHash.toLowerCase();

  // Let the database's unique constraint arbitrate concurrent verification requests.
  const inserted = await sql`
    INSERT INTO rglm_purchases
      (tx_hash, wallet_address, value_wei, rglm_amount_raw, block_number, verified_at)
    VALUES
      (${txHash}, ${wallet}, ${input.valueWei},
       ${input.rglmAmountRaw}, ${input.blockNumber}, NOW())
    ON CONFLICT (tx_hash) DO NOTHING
    RETURNING wallet_address
  `;

  if (inserted.length) return { inserted: true };

  // A conflict is idempotent only when the existing transaction belongs to this wallet.
  const existing = await sql`
    SELECT wallet_address
    FROM rglm_purchases
    WHERE tx_hash = ${txHash}
    LIMIT 1
  `;
  if (!existing.length) {
    throw new Error("Purchase record conflicted but could not be retrieved.");
  }
  if (String(existing[0].wallet_address).toLowerCase() !== wallet) {
    throw new Error("This transaction hash is already associated with a different wallet.");
  }
  return { inserted: false };
}

export async function getWalletPurchases(walletAddress: string) {
  const sql = getSql();
  return sql`
    SELECT
      tx_hash AS "txHash",
      wallet_address AS "walletAddress",
      value_wei::text AS "valueWei",
      rglm_amount_raw::text AS "rglmAmountRaw",
      block_number::text AS "blockNumber",
      verified_at AS "verifiedAt"
    FROM rglm_purchases
    WHERE wallet_address = ${walletAddress.toLowerCase()}
    ORDER BY verified_at DESC
    LIMIT 50
  `;
}
