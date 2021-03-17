#! /usr/bin/env node
import { Options } from "../src/tools/types";
import {
  deeplog,
  getApi,
  getLatestFinalizedBlock,
  getRemarksFromBlocks,
  prefixToArray,
} from "../src/tools/utils";
import fs from "fs";
import fetchRemarks from "../src/tools/fetchRemarks";
import commander from "commander";

export const addTo = (program: commander.CommanderStatic | typeof commander) =>
  program
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
      console.log(getRemarksFromBlocks(extracted));
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
