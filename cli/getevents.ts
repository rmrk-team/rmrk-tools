#! /usr/bin/env node
import "@polkadot/api-augment";
import { deeplog, getApi } from "../src/rmrk2.0.0/tools/utils";
import arg from "arg";

const getEvents = async () => {
  const args = arg({
    // Types
    "--ws": String, // The websocket URL
    "--blocks": String, // Blocks to extract events from, comma separated
  });

  const api = await getApi(args["--ws"] || "ws://127.0.0.1:9944");
  console.log("Connecting to " + args["--ws"]);
  const blocks = (args["--blocks"] || "").split(",").map(parseInt);
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
};

getEvents();
