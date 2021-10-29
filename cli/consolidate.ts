#! /usr/bin/env node
import fs from "fs";
import JsonAdapter from "../src/tools/consolidator/adapters/json";
import {
  CollectionConsolidated,
  Consolidator,
  ConsolidatorReturnType,
  NFTConsolidated,
} from "../src/tools/consolidator/consolidator";
import arg from "arg";
import { getApi, prefixToArray } from "../src/tools/utils";
import { compose, filter, map, values } from "ramda";

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
  const ja = new JsonAdapter(file, prefixes, collectionFilter, toBlock);
  const remarks = ja.getRemarks();
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

  fs.writeFileSync(
    out ? `consolidated-from-${out}` : `consolidated-from-${file}`,
    JSON.stringify({ ...result, lastBlock: ja.getLastBlock() })
  );
  process.exit(0);
};

consolidate();
