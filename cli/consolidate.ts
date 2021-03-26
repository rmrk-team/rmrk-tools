#! /usr/bin/env node
import fs from "fs";
import JsonAdapter from "../src/tools/consolidator/adapters/json";
import { Consolidator } from "../src/tools/consolidator/consolidator";
import arg from "arg";

const consolidate = async () => {
  const args = arg({
    "--json": String, // The JSON file from which to consolidate
  });

  const file = args["--json"];
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
  const ja = new JsonAdapter(file);
  const con = new Consolidator(ja);
  const ret = con.consolidate();
  fs.writeFileSync(
    `consolidated-from-${file}`,
    JSON.stringify({ ...ret, lastBlock: ja.getLastBlock() })
  );
};

consolidate();
