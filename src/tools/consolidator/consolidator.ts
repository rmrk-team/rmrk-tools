import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import * as fs from "fs";

import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";

export default class Consolidator {
  private adapter: JsonAdapter;
  constructor(initializedAdapter: JsonAdapter) {
    this.adapter = initializedAdapter;
  }

  public consolidate(): void {
    const remarks = this.adapter.getRemarks();
    const collections: C100[] = [];
    const invalidCalls: InvalidCall[] = [];
    const nfts: N100[] = [];
    //console.log(remarks);
    for (const remark of remarks) {
      switch (remark.interaction_type) {
        case "MINT":
          // A new collection was created
          const c = C100.fromRemark(remark.remark, remark.block);
          if (typeof c !== "boolean") {
            // Check if collection already minted
            if (collections.find((el) => el.id === c.id)) {
              invalidCalls.push({
                message: "Attempt to mint already existing collection",
                caller: remark.caller,
                object_id: c.id,
                block: remark.block,
                op_type: "MINT",
              } as InvalidCall);
              console.log(invalidCalls.length);
              continue;
            }
            // Check if collection ID matches expected format (pubkey + symbol)
            // const pubkey = decodeAddress(remark.caller);
            // const id = C100.generateId(u8aToHex(pubkey), c.symbol);
            // if (id !== c.id) {
            // invalidCalls.push({
            //   message: `Caller's pubkey ${u8aToHex(
            //     pubkey
            //   )} does not match generated ID`,
            //   caller: remark.caller,
            //   object_id: c.id,
            //   block: remark.block,
            //   op_type: "MINT",
            // } as InvalidCall);
            // console.log("skip");
            // continue;
            // }
            collections.push(c);
          }
          break;
        case "MINTNFT":
          // A new NFT was minted into a collection

          break;
        case "SEND":
          // An NFT was sent to a new owner

          break;
        case "BUY":
          // An NFT was bought after being LISTed

          break;
        case "LIST":
          // An NFT was listed for sale

          break;
        case "CHANGEISSUER":
          // The ownership of a collection has changed

          break;
        case "MIGRATE":
          // A collection and its NFT children are being migrated to a new version of the standard

          break;
        default:
          console.error(
            "Unable to process this remark - wrong type: " +
              remark.interaction_type
          );
          continue;
      }
    }
    console.log(collections);
    console.log(invalidCalls);
  }
}

type InvalidCall = {
  message: string;
  caller: string;
  block: number;
  object_id: string;
  op_type: string;
};
