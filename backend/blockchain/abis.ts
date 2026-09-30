export const ERC20_ABI = [
    { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
    { type: 'event', name: 'Transfer', anonymous: false, inputs: [{ indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }] },
] as const;

export const PRESALE_ABI = [
    { type: 'function', name: 'rate', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
    { type: 'function', name: 'token', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
    { type: 'function', name: 'rglmToken', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
] as const;

export const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55aaf7d6d5f' as const;
