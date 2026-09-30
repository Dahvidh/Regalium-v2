import { POLYGON_AMOY } from './config';

export async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const response = await fetch(POLYGON_AMOY.rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json() as { result?: T; error?: { message?: string } };
    if (payload.error) throw new Error(payload.error.message || 'Polygon RPC error');
    return payload.result as T;
}

export function encodeBalanceOf(address: string): string {
    return `0x70a08231${address.replace(/^0x/, '').padStart(64, '0')}`;
}

export function hex(value: bigint): string {
    return `0x${value.toString(16)}`;
}
