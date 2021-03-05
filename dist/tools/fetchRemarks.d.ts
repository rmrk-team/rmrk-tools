import { BlockCalls } from "./types";
import { ApiPromise } from "@polkadot/api";
declare const _default: (api: ApiPromise, from: number, to: number, prefixes: string[]) => Promise<BlockCalls[]>;
export default _default;
