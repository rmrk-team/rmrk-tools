import { Options } from "./tools/types";
import {
  getApi,
  getLatestFinalizedBlock,
  deeplog,
  prefixToArray,
} from "./tools/utils";
import program from "commander";
import fetchRemarks from "./tools/fetchRemarks";
import JsonAdapter from "./tools/consolidator/adapters/json";
import { Consolidator } from "./tools/consolidator/consolidator";
import { Seeder } from "../test/seed/seeder";
import { NFT as N100 } from "./rmrk1.0.0/classes/nft";
import * as fs from "fs";

program
  .command("fetch")
  .option("--ws <ws>", "The websocket URL", "ws://127.0.0.1:9944")
  .option("--from <from>", "The starting block, defaults to 0", "0")
  .option(
    "--append <path>",
    "Path to append new remarks to, will auto-detect last block and use it as FROM. Overrides FROM. If file does not exist, it will be created and FROM will default to 0."
  )
  .option(
    "--prefixes <prefixes>",
    "Limit remarks to prefix. No default. Can be hex (0x726d726b,0x524d524b) or string (rmrk,RMRK), or combination (rmrk,0x524d524b), separate with comma for multiple",
    ""
  )
  .option(
    "--to <to>",
    "Ending block, defaults to latest on given network",
    "latest"
  )
  .action(async (opts: Options) => {
    const api = await getApi(opts.ws);
    console.log("Connecting to " + opts.ws);
    const append = opts.append;
    let from = parseInt(opts.from);

    // Grab FROM from append file
    let appendFile = [];
    if (append) {
      console.log("Will append to " + append);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.appendFileSync(append, "");
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const fileContent = fs.readFileSync(append).toString();
        if (fileContent) {
          appendFile = JSON.parse(fileContent);
          if (appendFile.length) {
            const lastBlock = appendFile.pop();
            from = lastBlock.block;
          }
        }
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }

    const to =
      opts.to !== "latest"
        ? parseInt(opts.to)
        : await getLatestFinalizedBlock(api);
    if (from > to) {
      console.error("Starting block must be less than ending block.");
      process.exit(1);
    }
    console.log(`Processing block range from ${from} to ${to}.`);
    let extracted = await fetchRemarks(
      api,
      from,
      to,
      prefixToArray(opts.prefixes)
    );
    console.log(deeplog(extracted));
    let outputFileName = `remarks-${from}-${to}-${opts.prefixes}.json`;
    if (append) {
      extracted = appendFile.concat(extracted);
      console.log(`Appending ${appendFile.length} remarks found. Full set:`);
      console.log(deeplog(extracted));
      outputFileName = append;
    }
    extracted.push({
      block: to,
      calls: [],
    });
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(outputFileName, JSON.stringify(extracted));
    process.exit(0);
  });

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
      console.error("File is not readable. Are you providing the right path?");
      process.exit(1);
    }
    const ja = new JsonAdapter(file);
    const con = new Consolidator(ja);
    con.consolidate();
  });

program
  .command("seed")
  .option("--folder <folder>", "The folder from which to read seeds", "default")
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

program
  .command("getevents")
  .option("--ws <ws>", "The websocket URL", "ws://127.0.0.1:9944")
  .option("--blocks <blocks>", "Blocks to extract events from, comma separated")
  .action(async (opts: Options) => {
    const api = await getApi(opts.ws);
    console.log("Connecting to " + opts.ws);
    const blocks = opts.blocks.split(",").map(parseInt);
    console.log(`Processing blocks: ` + blocks.toString());
    for (const blockNum of blocks) {
      console.log(`==========  Block ${blockNum} =============`);
      const blockHash = await api.rpc.chain.getBlockHash(blockNum);
      const events = await api.query.system.events.at(blockHash);
      const block = await api.rpc.chain.getBlock(blockHash);
      if (block.block === undefined) {
        console.error("Block is undefined for block " + blockHash);
        continue;
      }
      console.log(`Found ${events.length} events`);
      console.log(`Found ${block.block.extrinsics.length} extrincics`);
      for (const e of events) {
        console.log(`~~~~ Event ${e.event.method.toString()} ~~~~`);
        deeplog(e.toHuman());
        deeplog(e.event.meta.toHuman());
        console.log(e.event.section.toString());
        console.log(e.event.method.toString());
        console.log(`~~~~ Event ${e.event.method.toString()} END ~~~~`);
      }
      let index = 0;
      for (const ex of block.block.extrinsics) {
        console.log(`=== Extrinsic ${blockNum}-${index} =============`);
        deeplog(ex.toHuman());
        console.log(`=== Extrinsic ${blockNum}-${index} END =============`);
        index++;
      }
      console.log(`==========  Block ${blockNum} END =============`);
    }
    process.exit(0);
  });

program
  .command("validate")
  .option("--remark <remark>", "The remark to validate")
  .action(async (opts: Options) => {
    const remark = opts.remark;
    const exploded = remark.split("::");
    if (exploded.length < 2) {
      throw new Error(
        "Invalid RMRK remark, cannot explode by double-colon (::)"
      );
    }
    if (exploded[0].toUpperCase() !== "RMRK") {
      throw new Error(
        "This is not a RMRK remark - does not begin with RMRK/rmrk"
      );
    }
    switch (exploded[1]) {
      case "MINTNFT":
        console.log("Identified as MINTNFT");
        const n = N100.fromRemark(remark);
        deeplog(n);
        break;
      default:
        throw new Error(`${exploded[1]} interaction not supported`);
    }
  });

program.parse(process.argv);
