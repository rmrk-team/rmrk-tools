import { Options } from "./tools/types";
import { getApi, getLatestFinalizedBlock, deeplog } from "./tools/utils";
import { stringToHex } from "@polkadot/util";
import program from "commander";
import fetchRemarks from "./tools/fetchRemarks";
import JsonAdapter from "./tools/consolidator/adapters/json";
import Consolidator from "./tools/consolidator/consolidator";
import * as fs from "fs";

program
  .command("fetch")
  .option("--ws <ws>", "The websocket URL", "ws://127.0.0.1:9944")
  .option("--from <from>", "The starting block, defaults to 0", "0")
  .option(
    "--prefix <prefix>",
    "Limit remarks to prefix. No default. Can be hex (0x726d726b) or string (rmrk)",
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
    const from = parseInt(opts.from);
    const to =
      opts.to !== "latest"
        ? parseInt(opts.to)
        : await getLatestFinalizedBlock(api);
    if (from > to) {
      console.error("Starting block must be less than ending block.");
      process.exit(1);
    }
    const prefix =
      opts.prefix === ""
        ? ""
        : opts.prefix.indexOf("0x") === 0
        ? opts.prefix
        : stringToHex(opts.prefix);
    console.log(`Processing block range from ${from} to ${to}.`);
    const extracted = await fetchRemarks(api, from, to, prefix);
    console.log(deeplog(extracted));
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      `remarks-${from}-${to}-${prefix}.json`,
      JSON.stringify(extracted)
    );
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

program.parse(process.argv);
