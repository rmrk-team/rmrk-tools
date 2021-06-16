import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString, stringToHex } from "@polkadot/util";
import { URL } from "url";
import { Remark } from "./consolidator/remark";
import { OP_TYPES } from "./constants";
import { SignedBlock } from "@polkadot/types/interfaces/runtime";
import { BlockCall, BlockCalls } from "./types";
import { Call as TCall } from "@polkadot/types/interfaces";
import { BlockHash } from "@polkadot/types/interfaces/chain";
import { encodeAddress, encodeDerivedAddress } from "@polkadot/util-crypto";
import { NFT } from "../rmrk1.0.0/classes/nft";

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

export const prefixToArray = (prefix: string): string[] =>
  prefix.split(",").map((item) => {
    if (item.indexOf("0x") === 0) {
      return item;
    }
    return stringToHex(item);
  });

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

type Call = BlockCall;

export type Block = {
  block: number;
  calls: Call[];
};

export const getRemarksFromBlocks = (
  blocks: Block[],
  prefixes: string[]
): Remark[] => {
  const remarks: Remark[] = [];
  for (const row of blocks) {
    for (const call of row.calls) {
      if (call.call !== "system.remark") continue;
      const str = hexToString(call.value);
      if (!prefixes.some((word) => str.startsWith(hexToString(word)))) {
        continue;
      }
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

export const isSystemRemark = (call: TCall, prefixes: string[]): boolean =>
  call.section === "system" &&
  call.method === "remark" &&
  (prefixes.length < 1 ||
    prefixes.some((word) => call.args.toString().startsWith(word)));

export const isUtilityBatch = (call: TCall) =>
  call.section === "utility" &&
  (call.method === "batch" || call.method === "batchAll");

export const hasInnerCall = (call: TCall): boolean =>
  call.section === "utility" && call.method === "asDerivative";

export const getInnerCall = (call: TCall) => {
  const sectionMethod = `${call.section}.${call.method}`;
  switch (sectionMethod) {
    case ("utility.asDerivative"): {
      return { call: call.args[1], derivedAcct: parseInt(call.args[0].toString()) };
    }

    default: {
      throw new Error(`Cannot get inner call from ${sectionMethod}.`);
    }
  }
};

export const getBlockCallsFromSignedBlock = async (
  signedBlock: SignedBlock,
  prefixes: string[],
  api: ApiPromise,
  ss58Format = 2
): Promise<BlockCall[] | []> => {
  let blockCalls: BlockCall[] = [];
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
        caller: encodeAddress(extrinsic.signer.toString(), ss58Format),
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

        const batchRoot = [] as BlockCall[];
        const batchExtras: BlockCall[] = [];
        batchArgs.forEach((el, i) => {
          if (isSystemRemark(el, prefixes)) {
            batchRoot.push({
              call: `${el.section}.${el.method}`,
              value: el.args.toString(),
              caller: encodeAddress(extrinsic.signer.toString(), ss58Format),
            } as BlockCall);
          } else {
            batchExtras.push({
              call: `${el.section}.${el.method}`,
              value: el.args.toString(),
              caller: encodeAddress(extrinsic.signer.toString(), ss58Format),
            } as BlockCall);
          }
        });

        if (batchExtras.length) {
          batchRoot.forEach((el, i) => {
            batchRoot[i].extras = batchExtras;
          });
        }

        blockCalls = blockCalls.concat(batchRoot);
      }
    } else if (hasInnerCall(extrinsic.method as TCall)) {
      const innerCall = getInnerCall(extrinsic.method as TCall);
      const derivedAccts: number[] = [];
      if (innerCall.derivedAcct !== undefined) {
        derivedAccts.push(innerCall.derivedAcct);
      }

      let method = api.createType("Call", innerCall.call);
      while (hasInnerCall(method)) {
        const innerCall = getInnerCall(method);
        method = api.createType("Call", innerCall.call);
        if (innerCall.derivedAcct !== undefined) {
          derivedAccts.push(innerCall.derivedAcct);
        }
      }

      if (isSystemRemark(method, prefixes)) {
        let address = encodeAddress(extrinsic.signer.toString(), ss58Format);
        derivedAccts.forEach((acctIdx) => {
          address = encodeDerivedAddress(address, acctIdx, ss58Format);
        })

        blockCalls.push({
          call: "system.remark",
          value: method.args.toString(),
          caller: address,
        });
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

/**
 * filterBlocksByCollection
 * Return blocks that match specific collection.
 * @param blockCalls
 * @param collectionFilter - name of the collection to filter by
 */
export const filterBlocksByCollection = (
  blockCalls: BlockCalls[],
  collectionFilter: string,
  prefixes: string[]
): BlockCalls[] =>
  blockCalls.filter((block) =>
    getRemarksFromBlocks([block], prefixes).some((rmrk) =>
      rmrk.remark.includes(collectionFilter)
    )
  );
