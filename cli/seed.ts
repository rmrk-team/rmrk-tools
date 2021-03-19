#! /usr/bin/env node
import { getApi } from "../src/tools/utils";
import { Seeder } from "../test/seed/seeder";
import arg from "arg";

const seed = async () => {
  const args = arg({
    // Types
    "--folder": String, // The folder from which to read seeds
    "--command": String, // Which seed to run
  });

  let folder = args["--folder"] || "default";
  let command = args["--command"] || "file";
  if (!folder.startsWith("test/seed")) folder = "test/seed/" + folder;
  console.log("Connecting to local chain...");
  const api = await getApi("ws://127.0.0.1:9944");
  console.log("Connected.");

  const s = new Seeder(api);

  if (command === "file") {
    console.log("Looking for seed files inside " + folder);
    await s.seedFromFolder(folder);
  } else if (command == "eggmachine") {
    console.log("Making eggs");
    await s.eggmachine();
  } else if (command == "egglist") {
    console.log("Listing eggs");
    await s.egglister();
  } else {
    console.error("Unknown command");
  }
  process.exit(0);
};

seed();
