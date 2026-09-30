export const POLYGON_AMOY = {
    chainId: 80002,
    chainIdHex: '0x13882',
    name: 'Polygon Amoy',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
} as const;

export const CONTRACTS = {
    rglm: '0x3772127acbd138f86fabcb2341860956b9190346',
    presale: '0xfe192ee4ace2d9848adb7f2aad874619ba410492',
} as const;

export const EXPLORERS = {
    token: `${POLYGON_AMOY.explorerUrl}/token/${CONTRACTS.rglm}#transactions`,
    presale: `${POLYGON_AMOY.explorerUrl}/address/${CONTRACTS.presale}`,
} as const;
