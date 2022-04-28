import { ApiPromise, WsProvider } from "@polkadot/api";

const WS_ENDPOINTS = [
  "wss://kusama-rpc.polkadot.io",
  "wss://kusama.api.onfinality.io/public-ws",
  "wss://kusama-rpc.dwellir.com",
];

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

const MAX_RETRIES = 5;
const WS_DISCONNECT_TIMEOUT_SECONDS = 20;

let wsProvider: WsProvider;
let polkadotApi: ApiPromise;
let healthCheckInProgress = false;

/**
 *
 * @param wsEndpoints - array of rpc ws endpoints. In the order of their priority
 */
const providerHealthCheck = async (wsEndpoints: string[]) => {
  const [primaryEndpoint, secondaryEndpoint, ...otherEndpoints] = wsEndpoints;
  console.log(
    `Performing ${WS_DISCONNECT_TIMEOUT_SECONDS} seconds health check for WS Provider fro rpc ${primaryEndpoint}.`
  );
  healthCheckInProgress = true;
  await sleep(WS_DISCONNECT_TIMEOUT_SECONDS * 1000);
  if (wsProvider.isConnected) {
    console.log(`All good. Connected back to ${primaryEndpoint}`);
    healthCheckInProgress = false;
    return true;
  } else {
    console.log(
      `rpc endpoint ${primaryEndpoint} still disconnected after ${WS_DISCONNECT_TIMEOUT_SECONDS} seconds. Disconnecting from ${primaryEndpoint} and switching to a backup rpc endpoint ${secondaryEndpoint}`
    );
    await wsProvider.disconnect();

    healthCheckInProgress = false;
    throw new Error(
      `rpc endpoint ${primaryEndpoint} still disconnected after ${WS_DISCONNECT_TIMEOUT_SECONDS} seconds.`
    );
  }
};

/**
 *
 * @param wsEndpoints - array of rpc ws endpoints. In the order of their priority
 */
const getProvider = async (wsEndpoints: string[]) => {
  const [primaryEndpoint, ...otherEndpoints] = wsEndpoints;
  return await new Promise<WsProvider | undefined>((resolve, reject) => {
    wsProvider = new WsProvider(primaryEndpoint);
    wsProvider.on("disconnected", async () => {
      console.log(`WS provider for rpc ${primaryEndpoint} disconnected!`);
      if (!healthCheckInProgress) {
        try {
          await providerHealthCheck(wsEndpoints);
          resolve(wsProvider);
        } catch (error: any) {
          reject(error);
        }
      }
    });
    wsProvider.on("connected", () => {
      console.log(`WS provider for rpc ${primaryEndpoint} connected`);
      resolve(wsProvider);
    });
    wsProvider.on("error", async () => {
      console.log(`Error thrown for rpc ${primaryEndpoint}`);
      if (!healthCheckInProgress) {
        try {
          await providerHealthCheck(wsEndpoints);
          resolve(wsProvider);
        } catch (error: any) {
          reject(error);
        }
      }
    });
  });
};

/**
 *
 * @param wsEndpoints - array of rpc ws endpoints. In the order of their priority
 * @param retry - retry count
 */
export const getApiWithReconnect = async (
  wsEndpoints: string[] = WS_ENDPOINTS,
  retry = 0
): Promise<ApiPromise> => {
  if (wsProvider && polkadotApi && polkadotApi.isConnected) return polkadotApi;
  const [primaryEndpoint, secondaryEndpoint, ...otherEndpoints] = wsEndpoints;

  try {
    const provider = await getProvider(wsEndpoints);
    polkadotApi = await ApiPromise.create({ provider });
    await polkadotApi.isReady;
    return polkadotApi;
  } catch (error: any) {
    if (retry < MAX_RETRIES) {
      // If we have reached maximum number of retries on the primaryEndpoint, let's move it to the end of array and try the secondary endpoint
      return await getApiWithReconnect(
        [secondaryEndpoint, ...otherEndpoints, primaryEndpoint],
        retry + 1
      );
    } else {
      return polkadotApi;
    }
  }
};

// const api = await getPolkadotApi();
