#! /usr/bin/env node
import fs from "fs";
import {
  CollectionConsolidated,
  Consolidator,
  ConsolidatorReturnType,
  NFTConsolidated,
} from "../src/tools/consolidator/consolidator";
import arg from "arg";
import {
  appendPromise,
  filterBlocksByCollection,
  getApi,
  getRemarksFromBlocks,
  prefixToArray,
} from "../src/tools/utils";
import { filter, map, values } from "ramda";
import { BlockCalls } from "../src/tools/types";
import { Remark } from "../src/tools/consolidator/remark";

/**
 * Create lightweight dump by excluding burned NFTs and emotes.
 * Note: using ramda utils in order to preserve Record structure.
 * @param result
 */
const getLiteDump = (result: ConsolidatorReturnType) => {
  result.nfts = filter((d: NFTConsolidated) => d.burned === "", result.nfts);
  result.nfts = map(
    (nft: any) => ({
      ...nft,
      reactions: [],
    }),
    result.nfts
  );
  result.invalid = [];
  // cleanup orphan collections
  result.collections = filter(
    (c: CollectionConsolidated) =>
      values(filter((n: NFTConsolidated) => n.collection === c.id, result.nfts))
        .length !== 0,
    result.collections
  );
  return result;
};

const getRemarks = (
  inputData: any,
  prefixes: string[],
  collectionFilter?: string
): Remark[] => {
  let blocks = inputData;
  if (collectionFilter) {
    blocks = filterBlocksByCollection(blocks, collectionFilter, prefixes);
  }
  return getRemarksFromBlocks(blocks, prefixes);
};

const consolidate = async () => {
  const args = arg({
    "--json": String, // The JSON file from which to consolidate
    "--collection": String, // Filter by specific collection
    "--ws": String, // Optional websocket url
    "--prefixes": String, // Limit remarks to prefix. No default. Can be hex (0x726d726b,0x524d524b) or string (rmrk,RMRK), or combination (rmrk,0x524d524b), separate with comma for multiple
    "--lite": String, // Lightweight version of dumps
    "--out": String, // optional output name
    "--to": Number, // Optional take block to inclusive
  });

  const ws = args["--ws"] || "ws://127.0.0.1:9944";
  const api = await getApi(ws);

  const toBlock = args["--to"];

  const prefixes = prefixToArray(args["--prefixes"] || "0x726d726b,0x524d524b");

  const systemProperties = await api.rpc.system.properties();
  const { ss58Format: chainSs58Format } = systemProperties.toHuman();

  const ss58Format = (chainSs58Format as number) || 2;

  const file = args["--json"];
  const collectionFilter = args["--collection"];
  const isLite = args["--lite"] || false;
  const out = args["--out"];

  if (!file) {
    console.error("File path must be provided");
    process.exit(1);
  }
  // Check the JSON file exists and is reachable
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch (e) {
    console.error("File is not readable. Are you providing the right path?");
    process.exit(1);
  }
  let rawdata = await appendPromise(file);
  if (toBlock) {
    rawdata = rawdata.filter((obj: BlockCalls) => obj.block <= Number(toBlock));
    console.log(`Take blocks to: ${toBlock}`);
  }

  console.log(`Loaded ${rawdata.length} blocks with remark calls`);

  const remarks = getRemarks(rawdata, prefixes, collectionFilter);
  const consolidator = new Consolidator(ss58Format);
  let result = await consolidator.consolidate(remarks);

  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  // Lightweight dumps exclude burned nfts and reactions / emotes.
  if (isLite) {
    result = getLiteDump(result);
  }

  const lastBlock = rawdata[rawdata.length - 1]?.block || 0;
  fs.writeFileSync(
    out ? `consolidated-from-${out}` : `consolidated-from-${file}`,
    JSON.stringify({ ...result, lastBlock })
  );
  process.exit(0);
};

consolidate();
