import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString, stringToHex } from "@polkadot/util";
import { URL } from "url";
import { Remark } from "./consolidator/remark";
import { OP_TYPES } from "./constants";
import { SignedBlock } from "@polkadot/types/interfaces/runtime";
import { BlockCall } from "./types";
import { Call as TCall } from "@polkadot/types/interfaces";
import { BlockHash } from "@polkadot/types/interfaces/chain";

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
  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
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

export const prefixToArray = function (prefix: string): string[] {
  const returnArray = [];
  const exploded = prefix.split(",");
  for (const p of exploded) {
    if (p.indexOf("0x") === 0) {
      returnArray.push(p);
    } else {
      returnArray.push(stringToHex(p));
    }
  }
  return returnArray;
};

const getMeta = (call: Call, block: number): RemarkMeta | false => {
  const str = hexToString(call.value);
  const arr = str.split("::");
  if (arr.length < 3) {
    console.error(`Invalid RMRK in block ${block}: ${str}`);
    return false;
  }
  return {
    type: arr[1],
    version: parseFloat(arr[2]) ? arr[2] : "0.1",
  } as RemarkMeta;
};

type RemarkMeta = {
  type: string;
  version: string;
};

interface Call {
  call: string;
  value: string;
  caller: string;
  extras?: BlockCall[];
}

export type Block = {
  block: number;
  calls: Call[];
};

export const getRemarksFromBlocks = (blocks: Block[]): Remark[] => {
  const remarks: Remark[] = [];
  for (const row of blocks) {
    for (const call of row.calls) {
      if (call.call !== "system.remark") continue;
      const meta = getMeta(call, row.block);
      if (!meta) continue;
      let remark;

      switch (meta.type) {
        case OP_TYPES.MINTNFT:
        case OP_TYPES.MINT:
          remark = decodeURI(hexToString(call.value));
          break;
        default:
          remark = hexToString(call.value);
          break;
      }

      const r: Remark = {
        block: row.block,
        caller: call.caller,
        interaction_type: meta.type,
        version: meta.version,
        remark: remark,
        extra_ex: call.extras,
      };
      remarks.push(r);
    }
  }
  return remarks;
};

export const isBatchInterrupted = async (
  api: ApiPromise,
  blockHash: BlockHash,
  extrinsicIndex: number
): Promise<boolean> => {
  const records = await api.query.system.events.at(blockHash);
  const events = records.filter(
    ({ phase, event }) =>
      phase.isApplyExtrinsic &&
      phase.asApplyExtrinsic.eq(extrinsicIndex) &&
      (event.method.toString() === "BatchInterrupted" ||
        event.method.toString() === "ExtrinsicFailed")
  );

  return Boolean(events.length);
};

const isSystemRemark = (call: TCall, prefixes: string[]) => {
  return (
    call.section === "system" &&
    call.method === "remark" &&
    (prefixes.length < 1 ||
      prefixes.some((word) => call.args.toString().startsWith(word)))
  );
};

const isUtilityBatch = (call: TCall) =>
  call.section === "utility" &&
  (call.method === "batch" || call.method === "batchAll");

export const getBlockCallsFromSignedBlock = async (
  signedBlock: SignedBlock,
  prefixes: string[],
  api: ApiPromise
): Promise<BlockCall[] | []> => {
  const blockCalls: BlockCall[] = [];
  const extrinsics = signedBlock?.block?.extrinsics;
  if (!Array.isArray(extrinsics)) {
    return blockCalls;
  }

  let extrinsicIndex = 0;
  for (const extrinsic of extrinsics) {
    if (extrinsic.isEmpty || !extrinsic.isSigned) {
      extrinsicIndex++;
      continue;
    }

    if (isSystemRemark(extrinsic.method as TCall, prefixes)) {
      blockCalls.push({
        call: "system.remark",
        value: extrinsic.args.toString(),
        caller: extrinsic.signer.toString(),
      });
    } else if (isUtilityBatch(extrinsic.method as TCall)) {
      // @ts-ignore
      const batchArgs: TCall[] = extrinsic.method.args[0];
      let remarkExists = 0;
      batchArgs.forEach((el) => {
        if (isSystemRemark(el, prefixes)) {
          remarkExists++;
        }
      });

      if (remarkExists) {
        const skip = await isBatchInterrupted(
          api,
          signedBlock.block.hash,
          extrinsicIndex
        );

        if (skip) {
          console.log(
            `Skipping batch ${signedBlock.block?.header?.number}-${extrinsicIndex} due to BatchInterrupted`
          );
          extrinsicIndex++;
          continue;
        }

        let batchRoot = {} as BlockCall;
        const batchExtras: BlockCall[] = [];
        batchArgs.forEach((el, i) => {
          if (el.section === "system" && el.method === "remark") {
            if (i < remarkExists - 1) {
              blockCalls.push({
                call: `${el.section}.${el.method}`,
                value: el.args.toString(),
                caller: extrinsic.signer.toString(),
              } as BlockCall);
            } else {
              batchRoot = {
                call: `${el.section}.${el.method}`,
                value: el.args.toString(),
                caller: extrinsic.signer.toString(),
              } as BlockCall;
            }
          } else {
            batchExtras.push({
              call: `${el.section}.${el.method}`,
              value: el.args.toString(),
              caller: extrinsic.signer.toString(),
            } as BlockCall);
          }
        });

        if (batchExtras.length) {
          batchRoot.extras = batchExtras;
        }
      }
    }
    extrinsicIndex++;
  }

  return blockCalls;
};

export const getRemarkData = (dataString: string) => {
  const data = decodeURIComponent(dataString);
  return JSON.parse(data);
};
