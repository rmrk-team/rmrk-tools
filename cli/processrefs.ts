#! /usr/bin/env node
import { NFT as N100 } from "../src/rmrk1.0.0/classes/nft";
import { Buy as Buy } from "../src/rmrk1.0.0/classes/buy";
import fs from "fs";
import { hexToString, stringToHex } from "@polkadot/util";
import JsonAdapter from "../src/tools/consolidator/adapters/json";
import { Consolidator } from "../src/tools/consolidator/consolidator";
import arg from "arg";
import { Remark } from "../src/tools/consolidator/remark";

const processRefs = async () => {
  const args = arg({
    // Types
    "--json": String, // The JSON file from which to consolidate
  });
  const file = args["--json"];

  if (!file) {
    console.error("No file provided");
    process.exit(1);
  }
  // Check the JSON file exists and is reachable
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch (e) {
    console.error("File is not readable. Are you providing the right path?");
    process.exit(1);
  }
  const ja = new JsonAdapter(file, ["0x726d726b", "0x524d524b"]);
  const remarks = ja.getRemarks();

  const referrals: Referral[] = [];
  for (const remark of remarks) {
    if (!remark.extra_ex) {
      continue;
    }
    if (extrasReferral(remark) === "") {
      continue;
    }
    const val = getTransferValue(remark);
    referrals.push({
      block: remark.block,
      ref: extrasReferral(remark),
      val: val.toString(),
    } as Referral);
  }

  console.log(referrals);

  process.exit(0);
};

type Referral = {
  block: number;
  ref: string;
  val: string;
};

function extrasReferral(remark: Remark): string {
  if (remark.extra_ex)
    for (const extra of remark.extra_ex) {
      if (
        extra.call == "system.remark" &&
        extra.value.startsWith("0x6b616e617")
      ) {
        return hexToString(extra.value);
      }
    }
  return "";
}

function getTransferValue(remark: Remark): BigInt {
  if (remark.extra_ex)
    for (const extra of remark.extra_ex) {
      if (extra.call == "balances.transfer") {
        return BigInt(extra.value.split(",")[1]);
      }
    }
  return BigInt(0);
}

processRefs();
