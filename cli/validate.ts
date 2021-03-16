#! /usr/bin/env node
import commander from "commander";
import { Options } from "../src/tools/types";
import { NFT as N100 } from "../src/rmrk1.0.0/classes/nft";
import { deeplog } from "../src/tools/utils";
import { OP_TYPES } from "../src/tools/constants";

export const addTo = (program: commander.CommanderStatic | typeof commander) =>
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
        case OP_TYPES.MINTNFT:
          console.log(`Identified as ${OP_TYPES.MINTNFT}`);
          const n = N100.fromRemark(remark);
          deeplog(n);
          break;
        default:
          throw new Error(`${exploded[1]} interaction not supported`);
      }
    });
