import { BlockCalls } from "./types";
import { deeplog, getBlockCallsFromSignedBlock } from "../tools/utils";
import { ApiPromise } from "@polkadot/api";

const PROBLEMATIC_BLCOKS = [7491223, 7487667];

export default async (
  api: ApiPromise,
  from: number,
  to: number,
  prefixes: string[],
  ss58Format = 2
): Promise<BlockCalls[]> => {
  const bcs: BlockCalls[] = [];
  for (let i = from; i <= to; i++) {
    if (i % 1000 === 0) {
      const event = new Date();
      console.log(`Block ${i} at time ${event.toTimeString()}`);
      if (i % 5000 === 0) {
        console.log(`Currently at ${bcs.length} remarks.`);
      }
    }

    if (PROBLEMATIC_BLCOKS.includes(i)) {
      continue;
    }

    const blockHash = await api.rpc.chain.getBlockHash(i);
    const block = await api.rpc.chain.getBlock(blockHash);

    if (block.block === undefined) {
      console.error("block.block is undefined for block " + i);
      deeplog(block);
      continue;
    }

    const blockCalls = await getBlockCallsFromSignedBlock(
      block,
      prefixes,
      api,
      ss58Format
    );

    if (blockCalls.length) {
      bcs.push({
        block: i,
        calls: blockCalls,
      } as BlockCalls);
    }
  }
  return bcs;
};
