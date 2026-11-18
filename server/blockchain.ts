export const POLYGON_AMOY = {
  chainId: 80002,
  chainIdHex: "0x13882",
  name: "Polygon Amoy",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com",
  explorerUrl: "https://amoy.polygonscan.com",
} as const;

export const CONTRACTS = {
  rglm: "0x3772127acbd138f86fabcb2341860956b9190346",
  presale: "0xfe192ee4ace2d9848adb7f2aad874619ba410492",
} as const;

export const EXPLORERS = {
  token: `${POLYGON_AMOY.explorerUrl}/token/${CONTRACTS.rglm}#transactions`,
  presale: `${POLYGON_AMOY.explorerUrl}/address/${CONTRACTS.presale}`,
} as const;

export const TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const RPC_ENDPOINTS = [
  process.env.POLYGON_AMOY_RPC_URL,
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);

export async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const failures: string[] = [];

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json() as { result?: T; error?: { message?: string } };
      if (payload.error) throw new Error(payload.error.message || "JSON-RPC error");
      if (!("result" in payload)) throw new Error("JSON-RPC response did not contain a result");

      return payload.result as T;
    } catch (cause) {
      failures.push(cause instanceof Error ? cause.message : "Unknown RPC error");
    }
  }

  throw new Error(`All Polygon Amoy RPC endpoints failed: ${failures.join("; ")}`);
}

export function decodeUint256(value: string | undefined): bigint {
  if (!value || !/^0x[0-9a-fA-F]+$/.test(value)) return 0n;
  return BigInt(value);
}

function normalizeAddress(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function decodeAddress(topic: string | undefined): string {
  if (!topic || topic.length < 42) return "";
  return `0x${topic.slice(-40)}`.toLowerCase();
}

type RpcLog = { address?: string; topics?: string[]; data?: string };
type RpcReceipt = { status?: string; blockNumber?: string; logs?: RpcLog[] } | null;
type RpcTransaction = { hash?: string; from?: string; to?: string | null; value?: string; blockNumber?: string | null };

function findRglmTransfer(logs: RpcLog[] | undefined, recipient: string) {
  const expectedRecipient = normalizeAddress(recipient);
  const expectedSender = CONTRACTS.presale.toLowerCase();

  for (const log of logs || []) {
    const topics = log.topics || [];
    if (normalizeAddress(log.address) !== CONTRACTS.rglm.toLowerCase()) continue;
    if (topics[0]?.toLowerCase() !== TRANSFER_EVENT_TOPIC) continue;
    if (decodeAddress(topics[1]) !== expectedSender) continue;
    if (decodeAddress(topics[2]) !== expectedRecipient) continue;
    const amountRaw = decodeUint256(log.data);
    if (amountRaw <= 0n) continue;
    return { amountRaw: amountRaw.toString(), token: CONTRACTS.rglm, sender: expectedSender };
  }
  return null;
}

export function isTransactionHash(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function isWalletAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function verifyTransaction(txHash: string, walletAddress?: string) {
  const tx = await rpc<RpcTransaction | null>("eth_getTransactionByHash", [txHash]);
  if (!tx) return { found: false, confirmed: false, successful: false };

  const receipt = await rpc<RpcReceipt>("eth_getTransactionReceipt", [txHash]);
  const confirmed = Boolean(receipt);
  const successful = receipt?.status === "0x1";
  const fromMatches = walletAddress ? normalizeAddress(tx.from) === normalizeAddress(walletAddress) : null;
  const toMatches = normalizeAddress(tx.to) === CONTRACTS.presale.toLowerCase();
  const transfer = successful && fromMatches === true && toMatches
    ? findRglmTransfer(receipt?.logs, walletAddress as string)
    : null;

  return {
    found: true,
    confirmed,
    successful,
    fromMatches,
    toMatches,
    walletAddress: walletAddress ? normalizeAddress(walletAddress) : null,
    txFrom: normalizeAddress(tx.from),
    txTo: normalizeAddress(tx.to),
    valueWei: tx.value || "0x0",
    blockNumber: receipt?.blockNumber || tx.blockNumber || null,
    rglmTransfer: transfer,
  };
}

export async function getPresaleRate(): Promise<bigint> {
  // keccak256("rate()") first four bytes; avoid relying on optional web3_sha3 RPC support.
  const raw = await rpc<string>("eth_call", [{ to: CONTRACTS.presale, data: "0x2c4e722e" }, "latest"]);
  return decodeUint256(raw);
}

export function decimalToWei(value: string): bigint | null {
  if (!/^(?:\\d+\\.?\\d*|\\.\\d+)$/.test(value)) return null;
  const [whole = "0", fraction = ""] = value.split(".");
  if (fraction.length > 18) return null;
  return BigInt(whole || "0") * 10n ** 18n + BigInt((fraction + "0".repeat(18)).slice(0, 18) || "0");
}
