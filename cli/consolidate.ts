#! /usr/bin/env node
import commander from "commander";
import { Options } from "../src/tools/types";
import fs from "fs";
import JsonAdapter from "../src/tools/consolidator/adapters/json";
import { Consolidator } from "../src/tools/consolidator/consolidator";

export const addTo = (program: commander.CommanderStatic | typeof commander) =>
  program
    .command("consolidate")
    .option("--json <json>", "The JSON file from which to consolidate")
    .action(async (opts: Options) => {
      const file = opts.json;
      if (!file) {
        console.error("File path must be provided");
        process.exit(1);
      }
      // Check the JSON file exists and is reachable
      try {
        fs.accessSync(file, fs.constants.R_OK);
      } catch (e) {
        console.error(
          "File is not readable. Are you providing the right path?"
        );
        process.exit(1);
      }
      const ja = new JsonAdapter(file);
      const con = new Consolidator(ja);
      con.consolidate();
    });
