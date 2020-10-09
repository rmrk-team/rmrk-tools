import { ApiPromise, WsProvider } from "@polkadot/api";

export const getApi = async (wsEndpoint: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = ApiPromise.create({ provider: wsProvider });
  return api;
};

export const getLatestBlock = async (api: ApiPromise): Promise<number> => {
  const header = await api.rpc.chain.getHeader();
  return header.number.toNumber();
};
