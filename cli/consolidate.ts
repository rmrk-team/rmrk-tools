#! /usr/bin/env node
import "@polkadot/api-augment";
import fs from "fs";
import { Consolidator } from "../src/rmrk2.0.0/tools/consolidator/consolidator";
import arg from "arg";
import {
  filterBlocksByCollection,
  getApi,
  getRemarksFromBlocks,
  prefixToArray,
} from "../src/rmrk2.0.0/tools/utils";
import { appendPromise } from "../test/2.0.0/utils/append-json-stream";
import { BlockCalls } from "../src/rmrk2.0.0/tools/types";
import { Remark } from "../src/rmrk2.0.0/tools/consolidator/remark";

const getRemarks = (
  inputData: any,
  prefixes: string[],
  collectionFilter?: string
): Remark[] => {
  let blocks = inputData;
  if (collectionFilter) {
    blocks = filterBlocksByCollection(blocks, prefixes, collectionFilter);
  }
  return getRemarksFromBlocks(blocks, prefixes);
};

const consolidate = async () => {
  const args = arg({
    "--json": String, // The JSON file from which to consolidate
    "--collection": String, // Filter by specific collection
    "--ws": String, // Optional websocket url
    "--prefixes": String, // Limit remarks to prefix. No default. Can be hex (0x726d726b,0x524d524b) or string (rmrk,RMRK), or combination (rmrk,0x524d524b), separate with comma for multiple
    "--to": Number, // Optional take block to inclusive
  });

  const ws = args["--ws"] || "ws://127.0.0.1:9944";
  const api = await getApi(ws);

  const prefixes = prefixToArray(args["--prefixes"] || "0x726d726b,0x524d524b");

  const systemProperties = await api.rpc.system.properties();
  const { ss58Format: chainSs58Format } = systemProperties.toHuman();

  const ss58Format = (chainSs58Format as number) || 2;

  const file = args["--json"];
  const collectionFilter = args["--collection"];
  if (!file) {
    console.error("File path must be provided through --json arg");
    process.exit(1);
  }

  const toBlock = args["--to"];

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

  const remarks = rawdata;
  const con = new Consolidator(ss58Format);



  const ret = await con.consolidate(remarks);

  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  const lastBlock = rawdata[rawdata.length - 1]?.block || 0;
  fs.writeFileSync(
    `consolidated-from-${file}`,
    JSON.stringify({ ...ret, lastBlock })
  );
  process.exit(0);
};

consolidate();
