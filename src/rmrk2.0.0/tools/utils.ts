import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString, stringToHex } from "@polkadot/util";
import { URL } from "url";
import { Remark } from "./consolidator/remark";
import { OP_TYPES, VERSION } from "./constants";
import { SignedBlock } from "@polkadot/types/interfaces/runtime";
import { BlockCall, BlockCalls } from "./types";
import { Call as TCall } from "@polkadot/types/interfaces";
import { BlockHash } from "@polkadot/types/interfaces/chain";
import { encodeAddress } from "@polkadot/keyring";
import { deriveMultisigAddress } from "./deriveMultisigAddress";

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
  prefixes: string[],
  ss58Format = 2
): Remark[] => {
  const remarks: Remark[] = [];
  for (const row of blocks) {
    for (const call of row.calls) {
      if (call.call !== "system.remark") continue;
      const str = hexToString(call.value);
      const isValid = validateDecode(str);
      if (
        !isValid ||
        !prefixes.some((word) => str.startsWith(hexToString(word))) ||
        !str.includes(`::${VERSION}::`)
      ) {
        continue;
      }
      const meta = getMeta(call, row.block);
      if (!meta) continue;
      let remark;

      switch (meta.type) {
        case OP_TYPES.MINT:
        case OP_TYPES.CREATE:
        case OP_TYPES.RESADD:
        case OP_TYPES.THEMEADD:
        case OP_TYPES.SETPROPERTY:
        case OP_TYPES.SETPRIORITY:
        case OP_TYPES.BASE:
          remark = decodeURI(hexToString(call.value));
          break;
        default:
          remark = hexToString(call.value);
          break;
      }

      const r: Remark = {
        block: row.block,
        caller: encodeAddress(call.caller, ss58Format),
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

export const validateDecode = (value: string) => {
  try {
    const decoded = decodeURI(value);
    return true;
  } catch (error: any) {
    console.log(error, value);
    return false;
  }
};

export const isSystemRemark = (call: TCall, prefixes: string[]): boolean =>
  call.section === "system" &&
  call.method === "remark" &&
  (prefixes.length < 1 ||
    prefixes.some((word) => call.args.toString().startsWith(word)));

export const isUtilityBatch = (call: TCall) =>
  call.section === "utility" &&
  (call.method === "batch" || call.method === "batchAll");

export const isMultiSig = (call: TCall) =>
  call.section === "multisig" && call.method === "asMulti";

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
    } else if (isMultiSig(extrinsic.method as TCall)) {
      /*
      First argument is multisig signers treshold, second is array of signer addresses,
      3rd some metadata and 4th can be a system.remark extrinsic call if one is sent
       */

      const [threshold, addresses, _, multisigRemarkHex] =
        extrinsic.method?.args || [];
      if (multisigRemarkHex) {
        try {
          const allMultisigAddresses = [
            ...(addresses.toJSON() as []),
            extrinsic.signer.toString(),
          ];
          const derivedMultisigAccount = deriveMultisigAddress({
            addresses: allMultisigAddresses,
            threshold: Number(threshold.toString()),
            ss58Prefix: ss58Format,
          });
          const multiSigRemarkCall = api.registry.createType(
            "Call",
            multisigRemarkHex.toU8a(true)
          );

          if (isSystemRemark(multiSigRemarkCall, prefixes)) {
            blockCalls.push({
              call: "system.remark",
              value: multiSigRemarkCall.args.toString(),
              caller: derivedMultisigAccount,
            });
          }
        } catch (error: any) {
          console.log(
            `Skipping multisig call ${signedBlock.block?.header?.number}-${extrinsicIndex} due to the fact that we cannot decode 3rd argument which is supposed to be system.remark`,
            error
          );
          extrinsicIndex++;
          continue;
        }
      }
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
        const batchBuyExtras: BlockCall[] = [];
        batchArgs.forEach((el, i) => {
          if (isSystemRemark(el, prefixes)) {
            batchRoot.push({
              call: `${el.section}.${el.method}`,
              value: el.args.toString(),
              caller: encodeAddress(extrinsic.signer.toString(), ss58Format),
            } as BlockCall);
          } else {
            const isBalanceTransfer =
              `${el.section}.${el.method}` === `balances.transfer`;

            const extraCall = {
              call: `${el.section}.${el.method}`,
              value: el.args.toString(),
              caller: encodeAddress(extrinsic.signer.toString(), ss58Format),
            } as BlockCall;

            if (isBalanceTransfer) {
              batchBuyExtras.push(extraCall);
            } else {
              batchExtras.push(extraCall);
            }
          }
        });

        if (batchExtras.length) {
          batchRoot.forEach((el, i) => {
            batchRoot[i].extras = batchExtras;
          });
        }

        // Only 1 NFT can be purchased in a batch
        if (batchBuyExtras.length) {
          batchRoot[0].extras = batchBuyExtras;
        }

        blockCalls = blockCalls.concat(batchRoot);
      }
    }
    extrinsicIndex++;
  }

  return blockCalls;
};

export const getRemarkData = (dataString: string) => {
  const data = decodeURIComponent(dataString);
  try {
    return JSON.parse(data);
  } catch (error) {
    return data;
  }
};

/**
 * filterBlocksByCollection
 * Return blocks that match specific collection.
 * @param blockCalls
 * @param collectionFilter - name of the collection to filter by
 */
export const filterBlocksByCollection = (
  blockCalls: BlockCalls[],
  prefixes: string[],
  collectionFilter?: string,
  ss58Format?: number
): BlockCalls[] =>
  blockCalls.filter((block) =>
    getRemarksFromBlocks([block], prefixes, ss58Format).some(
      (rmrk) =>
        (collectionFilter && rmrk.remark.includes(collectionFilter)) ||
        !collectionFilter
    )
  );
