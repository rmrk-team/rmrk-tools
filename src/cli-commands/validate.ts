import program from "commander";
import { Options } from "../tools/types";
import { NFT as N100 } from "../rmrk1.0.0/classes/nft";
import { deeplog } from "../tools/utils";

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
