import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
//import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import * as fs from "fs";

export default class Consolidator {
  private adapter: JsonAdapter;
  constructor(initializedAdapter: JsonAdapter) {
    this.adapter = initializedAdapter;
  }

  public consolidate(): void {
    const remarks = this.adapter.getRemarks();
    const collections: C100[] = [];
    //const nfts: N100[] = [];
    for (const remark of remarks) {
      switch (remark.interaction_type) {
        case "MINT":
          // A new collection was created

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
  }
}
