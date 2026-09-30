import { db, error, json, router } from '@appdeploy/sdk';
import { CONTRACTS, EXPLORERS, POLYGON_AMOY } from './blockchain/config';
import { TRANSFER_EVENT_TOPIC } from './blockchain/abis';
import { decodeUint256, rpc } from './blockchain/rpc';

const TOKEN = CONTRACTS.rglm;
const PRESALE = CONTRACTS.presale;
const CHAIN_ID = POLYGON_AMOY.chainIdHex;
const NETWORK = POLYGON_AMOY.name;
const RPC = POLYGON_AMOY.rpcUrl;
const EXPLORER = POLYGON_AMOY.explorerUrl;
const TRANSFER_TOPIC = TRANSFER_EVENT_TOPIC;

type RpcLog = { address?: string; topics?: string[]; data?: string };
type RpcReceipt = { status?: string; blockNumber?: string; logs?: RpcLog[] } | null;
type RpcTransaction = { hash?: string; from?: string; to?: string | null; value?: string; blockNumber?: string | null } | null;

function normalizeAddress(value: unknown): string {
    return typeof value === 'string' ? value.toLowerCase() : '';
}

function isHash(value: unknown): value is string {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value);
}

function decodeAddress(topic: string | undefined): string {
    if (!topic || topic.length < 42) return '';
    return `0x${topic.slice(-40)}`.toLowerCase();
}

function findRglmTransfer(logs: RpcLog[] | undefined, recipient: string) {
    const expectedRecipient = normalizeAddress(recipient);
    for (const log of logs || []) {
        const topics = log.topics || [];
        if (normalizeAddress(log.address) !== TOKEN.toLowerCase()) continue;
        if (topics[0]?.toLowerCase() !== TRANSFER_TOPIC) continue;
        if (decodeAddress(topics[2]) !== expectedRecipient) continue;
        return { amountRaw: decodeUint256(log.data).toString(), token: TOKEN };
    }
    return null;
}

async function verifyTransaction(txHash: string, walletAddress: string) {
    const tx = await rpc<RpcTransaction>('eth_getTransactionByHash', [txHash]);
    if (!tx) return { found: false, confirmed: false, successful: false };
    const receipt = await rpc<RpcReceipt>('eth_getTransactionReceipt', [txHash]);
    const confirmed = Boolean(receipt);
    const successful = receipt?.status === '0x1';
    const fromMatches = normalizeAddress(tx.from) === normalizeAddress(walletAddress);
    const toMatches = normalizeAddress(tx.to) === PRESALE.toLowerCase();
    const transfer = successful && fromMatches && toMatches ? findRglmTransfer(receipt?.logs, walletAddress) : null;
    return { found: true, confirmed, successful, fromMatches, toMatches, walletAddress: normalizeAddress(walletAddress), txFrom: normalizeAddress(tx.from), txTo: normalizeAddress(tx.to), valueWei: tx.value || '0x0', blockNumber: receipt?.blockNumber || tx.blockNumber || null, rglmTransfer: transfer };
}

function utf8Hex(value: string): string {
    return `0x${Array.from(new TextEncoder().encode(value)).map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function contractSelector(signature: string): Promise<string> {
    const hash = await rpc<string>('web3_sha3', [utf8Hex(signature)]);
    return hash.slice(0, 10);
}

export const handler = router({
    'GET /api/_healthcheck': [async () => json({ status: 'ok', service: 'regalium-backend' })],
    'GET /api/config': [async () => json({ network: NETWORK, chainId: CHAIN_ID, chainIdDecimal: POLYGON_AMOY.chainId, nativeCurrency: POLYGON_AMOY.nativeCurrency, token: TOKEN, presale: PRESALE, rpc: RPC, explorer: EXPLORER, tokenExplorer: EXPLORERS.token, presaleExplorer: EXPLORERS.presale })],
    'GET /api/presale/quote': [async ({ query }) => {
        const pol = typeof query.pol === 'string' ? query.pol : '';
        if (!/^(?:\d+\.?\d*|\.\d+)$/.test(pol) || Number(pol) <= 0) return error('A positive POL amount is required.', 400);
        try {
            const selector = await contractSelector('rate()');
            const rateRaw = await rpc<string>('eth_call', [{ to: PRESALE, data: selector }, 'latest']);
            const rate = decodeUint256(rateRaw);
            if (rate === 0n) return error('The presale contract did not return a valid rate.', 503);
            const polWei = BigInt(Math.floor(Number(pol) * 1e18));
            return json({ pol, rateRglmPerPolRaw: rate.toString(), rglmRaw: (polWei * rate).toString(), decimals: 18, source: 'presale-contract', selector });
        } catch (cause) {
            console.error('Presale quote failed', cause);
            return error('Unable to read the current presale rate from the contract.', 502);
        }
    }],
    'GET /api/transactions/:hash': [async ({ params }) => {
        if (!isHash(params.hash)) return error('Invalid transaction hash.', 400);
        try {
            return json(await verifyTransaction(params.hash, '0x0000000000000000000000000000000000000000'));
        } catch (cause) {
            console.error('Transaction lookup failed', cause);
            return error('Unable to query Polygon Amoy right now.', 502);
        }
    }],
    'POST /api/presale/verify': [async ({ body }) => {
        const input = body as { txHash?: unknown; walletAddress?: unknown };
        if (!isHash(input.txHash)) return error('A valid transaction hash is required.', 400);
        if (typeof input.walletAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(input.walletAddress)) return error('A valid wallet address is required.', 400);
        try {
            const result = await verifyTransaction(input.txHash, input.walletAddress);
            if (!result.found) return error('Transaction not found on Polygon Amoy.', 404);
            if (!result.confirmed) return json({ verified: false, pending: true, result });
            if (!result.successful) return json({ verified: false, pending: false, failed: true, result });
            if (!result.fromMatches || !result.toMatches) return error('Transaction does not match the connected wallet and Regalium presale contract.', 422);
            if (!result.rglmTransfer) return error('Transaction succeeded, but no RGLM transfer to the connected wallet was found in the receipt.', 422);
            const table = `purchase:${normalizeAddress(input.walletAddress)}`;
            const existing = await db.list<{ txHash: string }>(table, { filter: { txHash: input.txHash }, limit: 1 });
            if (existing.items.length === 0) await db.add(table, [{ txHash: input.txHash, walletAddress: normalizeAddress(input.walletAddress), valueWei: result.valueWei, rglmAmountRaw: result.rglmTransfer.amountRaw, blockNumber: result.blockNumber, verifiedAt: new Date().toISOString() }]);
            return json({ verified: true, pending: false, result });
        } catch (cause) {
            console.error('Presale verification failed', cause);
            return error('Unable to verify the purchase on Polygon Amoy right now.', 502);
        }
    }],
    'GET /api/presale/history/:wallet': [async ({ params }) => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(params.wallet)) return error('Invalid wallet address.', 400);
        try {
            const result = await db.list(`purchase:${normalizeAddress(params.wallet)}`, { limit: 50 });
            return json({ walletAddress: normalizeAddress(params.wallet), items: result.items });
        } catch (cause) {
            console.error('Purchase history lookup failed', cause);
            return error('Unable to load purchase history.', 500);
        }
    }],
});
