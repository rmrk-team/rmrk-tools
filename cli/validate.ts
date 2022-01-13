#! /usr/bin/env node
import "@polkadot/api-augment";
import { NFT as N100 } from "../src/rmrk2.0.0/classes/nft";
import { deeplog } from "../src/rmrk2.0.0/tools/utils";
import { OP_TYPES } from "../src/rmrk2.0.0/tools/constants";
import arg from "arg";

const validate = async () => {
  const args = arg({
    // Types
    "--remark": String, // The remark to validate
  });

  const remark = args["--remark"] || "";
  const exploded = remark.split("::");
  if (exploded.length < 2) {
    throw new Error("Invalid RMRK remark, cannot explode by double-colon (::)");
  }
  if (exploded[0].toUpperCase() !== "RMRK") {
    throw new Error(
      "This is not a RMRK remark - does not begin with RMRK/rmrk"
    );
  }
  switch (exploded[1]) {
    case OP_TYPES.MINT:
      console.log(`Identified as ${OP_TYPES.MINT}`);
      const n = N100.fromRemark(remark);
      deeplog(n);
      break;
    default:
      throw new Error(`${exploded[1]} interaction not supported`);
  }
};
