#! /usr/bin/env node
import { getApi } from "../src/tools/utils";
import { Seeder } from "../test/seed/seeder";
import readline from "readline";
import arg from "arg";
import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import Blob from "cross-blob";

const seed = async () => {
  const args = arg({
    // Types
    "--folder": String, // The folder from which to read seeds
    "--command": String, // Which seed to run. If "file" looks in the `folder` location provided
    "--ws": String, // Which remote to connect to, defaults to local (ws://127.0.0.1:9944)
    "--phrase": String, // Mnemonic phrase of the wallet from which to seed. Defaults to `//Alice` for dev chain.
  });

  let folder = args["--folder"] || "default";
  let command = args["--command"] || "file";
  let ws = args["--ws"] || "ws://127.0.0.1:9944";
  let phrase = args["--phrase"] || "//Alice";
  if (!folder.startsWith("test/seed")) folder = "test/seed/" + folder;
  console.log("Connecting...");
  const api = await getApi(ws);
  console.log("Connected.");

  const kp = getKeyringFromUri(phrase);
  console.log(`Will seed from ${kp.address}`);

  if ((await api.rpc.system.chain()).toHuman() != "Development") {
    console.warn("Warning: you are seeding a non-development chain!");
    askQuestion(
      "⚠⚠⚠ Are you sure you want to proceed? This might be expensive! Enter YES to override: "
    ).then(async (answer) => {
      if (answer === "YES") {
        if (phrase == "//Alice") {
          console.error(
            "You cannot seed a non-development chain from the //Alice account. This account is only available in dev."
          );
          process.exit(1);
        }
        await goSeed(command, kp);
      } else {
        console.log("Execution stopped");
        process.exit(1);
      }
    });
  } else {
    await goSeed(command, kp);
  }

  async function goSeed(command: string, kp: KeyringPair) {
    const s = new Seeder(api, kp);

    switch (command) {
      case "file":
        console.log("Looking for seed files inside " + folder);
        await s.seedFromFolder(folder);
        break;
      case "eggs-remarks":
        console.log("Minting collection");
        const remarks = await s.seedAll();
        console.log(new Blob(remarks).size);
        // You can also pass from / to to this function to throttle. Remember that [0] is Collection, so always make sure that one is minted first.
        console.log(remarks);
        await s.issueRemarks(remarks, 6000, 9999);
        //await s.issueRemarks(remarks, 100, 110);
        //await s.issueRemarks(remarks);
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

function getKeyringFromUri(phrase: string): KeyringPair {
  const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
  return keyring.addFromUri(phrase);
}

seed();
