import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import * as fs from "fs";

import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";

export default class Consolidator {
  private adapter: JsonAdapter;
  private invalidCalls: InvalidCall[];
  private collections: C100[];
  constructor(initializedAdapter: JsonAdapter) {
    this.adapter = initializedAdapter;
    this.invalidCalls = [];
    this.collections = [];
  }

  public consolidate(): void {
    const remarks = this.adapter.getRemarks();
    const nfts: N100[] = [];
    //console.log(remarks);
    for (const remark of remarks) {
      switch (remark.interaction_type) {
        case "MINT":
          // A new collection was created
          console.log("Instantiating collection from " + remark.remark);
          const c = C100.fromRemark(remark.remark, remark.block);

          if (typeof c !== "boolean") {
            console.log("Collection instantiated OK");
            const pubkey = decodeAddress(remark.caller);
            const id = C100.generateId(u8aToHex(pubkey), c.symbol);

            if (this.collections.find((el) => el.id === c.id)) {
              this.invalidCalls.push({
                message: "Attempt to mint already existing collection",
                caller: remark.caller,
                object_id: c.id,
                block: remark.block,
                op_type: "MINT",
              } as InvalidCall);
              continue;
            } else if (id !== c.id) {
              this.invalidCalls.push({
                message: `Caller's pubkey ${u8aToHex(
                  pubkey
                )} does not match generated ID`,
                caller: remark.caller,
                object_id: c.id,
                block: remark.block,
                op_type: "MINT",
              } as InvalidCall);
              continue;
            }
            this.collections.push(c);
          }
          console.log("Collection was not instantiated OK");
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
        default:
          console.error(
            "Unable to process this remark - wrong type: " +
              remark.interaction_type
          );
          continue;
      }
    }
    console.log(this.collections);
    console.log(this.invalidCalls);
  }
}

type InvalidCall = {
  message: string;
  caller: string;
  block: number;
  object_id: string;
  op_type: string;
};
