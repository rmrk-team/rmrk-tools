import { ApiPromise, WsProvider } from "@polkadot/api";
import { URL } from "url";

export const getApi = async (wsEndpoint: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = ApiPromise.create({ provider: wsProvider });
  return api;
};

export const getLatestBlock = async (api: ApiPromise): Promise<number> => {
  const header = await api.rpc.chain.getHeader();
  return header.number.toNumber();
};

export const getLatestFinalizedBlock = async (
  api: ApiPromise
): Promise<number> => {
  const hash = await api.rpc.chain.getFinalizedHead();
  const header = await api.rpc.chain.getHeader(hash);
  if (header.number.toNumber() === 0) {
    console.error("Unable to retrieve finalized head - returned genesis block");
    process.exit(1);
  }
  return header.number.toNumber();
};

export const deeplog = function (obj: any): void {
  console.log(JSON.stringify(obj, null, 2));
};

export const stringIsAValidUrl = (s: string): boolean => {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};
