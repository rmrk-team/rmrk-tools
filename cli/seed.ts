#! /usr/bin/env node
import { getApi } from "../src/tools/utils";
import { Seeder } from "../test/seed/seeder";
import readline from "readline";
import arg from "arg";

const seed = async () => {
  const args = arg({
    // Types
    "--folder": String, // The folder from which to read seeds
    "--command": String, // Which seed to run. If "file" looks in the `folder` location provided
    "--ws": String, // Which remote to connect to, defaults to local (ws://127.0.0.1:9944)
    "--pk": String, // Private key of the wallet from which to seed
  });

  let folder = args["--folder"] || "default";
  let command = args["--command"] || "file";
  let ws = args["--ws"] || "ws://127.0.0.1:9944";
  if (!folder.startsWith("test/seed")) folder = "test/seed/" + folder;
  console.log("Connecting...");
  const api = await getApi(ws);
  console.log("Connected.");

  if ((await api.rpc.system.chain()).toHuman() == "Development") {
    console.warn("Warning: you are seeding a non-development chain!");
    askQuestion(
      "⚠⚠⚠ Are you sure you want to proceed? This might be expensive! Enter YES to override: "
    ).then(async (answer) => {
      if (answer === "YES") {
        await goSeed(command);
      } else {
        console.log("Execution stopped");
        process.exit(1);
      }
    });
  } else {
    await goSeed(command);
  }

  async function goSeed(command: string) {
    const s = new Seeder(api);

    switch (command) {
      case "file":
        console.log("Looking for seed files inside " + folder);
        await s.seedFromFolder(folder);
        break;
      default:
        console.error(`Unknown command ${command}`);
        break;
    }
    process.exit(0);
  }
};

function askQuestion(query: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

seed();
