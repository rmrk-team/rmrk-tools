#! /usr/bin/env node
import commander from "commander";
import { Options } from "../src/tools/types";
import { getApi } from "../src/tools/utils";
import { Seeder } from "../test/seed/seeder";

export const addTo = (program: commander.CommanderStatic | typeof commander) =>
  program
    .command("seed")
    .option(
      "--folder <folder>",
      "The folder from which to read seeds",
      "default"
    )
    .action(async (opts: Options) => {
      let folder = opts.folder;
      if (!folder.startsWith("test/seed")) folder = "test/seed/" + folder;
      console.log("Connecting to local chain...");
      const api = await getApi("ws://127.0.0.1:9944");
      console.log("Connected.");
      console.log("Looking for seed files inside " + folder);
      const s = new Seeder(api);
      await s.seedFromFolder(folder);
      process.exit(0);
    });
