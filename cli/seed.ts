#! /usr/bin/env node
import { getApi } from "../src/tools/utils";
import { Seeder } from "../test/seed/seeder";
import arg from "arg";

const seed = async () => {
  const args = arg({
    // Types
    "--folder": String, // The folder from which to read seeds
  });

  let folder = args["--folder"] || "default";
  if (!folder.startsWith("test/seed")) folder = "test/seed/" + folder;
  console.log("Connecting to local chain...");
  const api = await getApi("ws://127.0.0.1:9944");
  console.log("Connected.");
  console.log("Looking for seed files inside " + folder);
  const s = new Seeder(api);
  await s.seedFromFolder(folder);
  process.exit(0);
};

seed();
