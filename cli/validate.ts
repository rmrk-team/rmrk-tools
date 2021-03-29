#! /usr/bin/env node
import { NFT as N100 } from "../src/rmrk1.0.0/classes/nft";
import { deeplog } from "../src/tools/utils";
import { OP_TYPES } from "../src/tools/constants";
import arg from "arg";
import { isValidAddress } from "../src/tools/utils";

const validate = async () => {
  const args = arg({
    // Types
    "--remark": String, // The remark to validate
    "--address": String, // The address to validate
  });

  const remark = args["--remark"] || "";
  const address = args["--address"] || "";

  if (remark !== "") {
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
  }

  if (address != "") {
    console.log(isValidAddress(address));
  }
};
