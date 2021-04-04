#! /usr/bin/env node
import fs from "fs";
import JsonAdapter from "../src/tools/consolidator/adapters/json";
import { Consolidator } from "../src/tools/consolidator/consolidator";
import arg from "arg";
import { getApi } from "../src/tools/utils";

const consolidate = async () => {
  const args = arg({
    "--json": String, // The JSON file from which to consolidate
    "--collection": String, // Filter by specific collection
    "--ws": String, // Optional websocket url
  });

  const ws = args["--ws"] || "ws://127.0.0.1:9944";
  const api = await getApi(ws);

  const systemProperties = await api.rpc.system.properties();
  const { ss58Format: chainSs58Format } = systemProperties.toHuman();

  const ss58Format = (chainSs58Format as number) || 2;

  const file = args["--json"];
  const collectionFilter = args["--collection"];
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
  const ja = new JsonAdapter(file, collectionFilter);
  const con = new Consolidator(ja, ss58Format);
  const ret = con.consolidate();

  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
  fs.writeFileSync(
    `consolidated-from-${file}`,
    JSON.stringify({ ...ret, lastBlock: ja.getLastBlock() })
  );
};

consolidate();
