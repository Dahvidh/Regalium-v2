import { CONTRACTS, EXPLORERS, POLYGON_AMOY } from "./blockchain";

export function publicConfig() {
  return {
    network: POLYGON_AMOY.name,
    chainId: POLYGON_AMOY.chainIdHex,
    chainIdDecimal: POLYGON_AMOY.chainId,
    nativeCurrency: POLYGON_AMOY.nativeCurrency,
    token: CONTRACTS.rglm,
    presale: CONTRACTS.presale,
    rpc: POLYGON_AMOY.rpcUrl,
    explorer: POLYGON_AMOY.explorerUrl,
    tokenExplorer: EXPLORERS.token,
    presaleExplorer: EXPLORERS.presale,
  };
}
