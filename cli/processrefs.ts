#! /usr/bin/env node
import { NFT as N100, NFT } from "../src/rmrk1.0.0/classes/nft";
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
  let eggnum = 0;

  const referrals: Referral[] = [];
  for (const remark of remarks) {
    if (!remark.extra_ex) {
      continue;
    }
    if (extrasReferral(remark) === "") {
      continue;
    }
    if (remark.interaction_type != "BUY") {
      continue;
    }
    const val = getTransferValue(remark);
    referrals.push({
      block: remark.block,
      ref: extrasReferral(remark),
      val: val.toString(),
      egg: getEggNum(remark),
    } as Referral);
  }

  let csv = "block,ref,sale value,rmrk earned\n";
  //@ts-ignore
  const eggsWithRefs: {} = {};
  //@ts-ignore
  const eggsPerRef: {} = {}
  for (const ref of referrals) {
    //console.log(ref);
    // Build a CSV
    let commission = BigInt(0);
    if (
      ["2000000000000", "20000000000000", "100000000000000"].includes(ref.val)
    ) {
      commission = BigInt(ref.val);
    } else {
      commission = BigInt(ref.val) / BigInt(100);
    }
    csv += `${ref.block},${ref.ref},${ref.val},${commission.toString()}` + "\n";
    if (ref.egg) {
      //@ts-ignore
      eggsWithRefs[ref.egg] = ref.ref;
      //@ts-ignore
      if (eggsPerRef[ref.ref] === undefined) {
        //@ts-ignore
        eggsPerRef[ref.ref] = { "F": 0, "R": 0, "LE": 0 };
      }
      if (ref.egg < 100) {
        //@ts-ignore
        eggsPerRef[ref.ref]["F"] += 1;
      } else if (ref.egg < 1000) {
        //@ts-ignore
        eggsPerRef[ref.ref]["R"] += 1;
      } else {
        //@ts-ignore
        eggsPerRef[ref.ref]["LE"] += 1;
      }
    }
  }
  fs.writeFileSync("./processed-amt-per-ref.csv", csv);
  fs.writeFileSync("./processed-ref-for-egg.json", JSON.stringify(eggsWithRefs));
  fs.writeFileSync("./processed-eggs-per-ref.json", JSON.stringify(eggsPerRef));

  process.exit(0);
};

type Referral = {
  block: number;
  ref: string;
  val: string;
  egg: number;
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

function getEggNum(remark: Remark): number {
  const n = Buy.fromRemark(remark.remark) as Buy;
  const id = n.id.split("-").pop();
  return parseInt(id ? id : "0");
  //return 0;
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
