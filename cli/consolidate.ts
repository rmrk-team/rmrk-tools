#! /usr/bin/env node
import fs from "fs";
import JsonAdapter from "../src/rmrk2.0.0/tools/consolidator/adapters/json";
import { Consolidator } from "../src/rmrk2.0.0/tools/consolidator/consolidator";
import arg from "arg";
import { getApi, prefixToArray } from "../src/rmrk2.0.0/tools/utils";

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
  const ja = new JsonAdapter(file, prefixes, collectionFilter, toBlock);
  const remarks = ja.getRemarks();
  const con = new Consolidator(ss58Format);
  const ret = await con.consolidate(remarks);

  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  fs.writeFileSync(
    `consolidated-from-${file}`,
    JSON.stringify({ ...ret, lastBlock: ja.getLastBlock() })
  );
  process.exit(0);
};

consolidate();
