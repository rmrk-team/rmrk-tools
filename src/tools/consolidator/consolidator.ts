import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { Change } from "../../rmrk1.0.0/changelog";
import { deeplog } from "../utils";
import * as fs from "fs";

import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";

export default class Consolidator {
  private adapter: JsonAdapter;
  private invalidCalls: InvalidCall[];
  private collections: C100[];
  private nfts: N100[];
  constructor(initializedAdapter: JsonAdapter) {
    this.adapter = initializedAdapter;
    this.invalidCalls = [];
    this.collections = [];
    this.nfts = [];
  }

  public consolidate(): void {
    const remarks = this.adapter.getRemarks();
    //console.log(remarks);
    for (const remark of remarks) {
      console.log("==============================");
      console.log("Remark is: " + remark.remark);
      switch (remark.interaction_type) {
        case "MINT":
          // A new collection was created
          console.log("Instantiating collection");
          const c = C100.fromRemark(remark.remark, remark.block);

          if (typeof c === "string") {
            // console.log(
            //   "Collection was not instantiated OK from " + remark.remark
            // );
            this.invalidCalls.push({
              message: `[MINT] Dead before instantiation: ${c}`,
              caller: remark.caller,
              object_id: remark.remark,
              block: remark.block,
              op_type: "MINT",
            } as InvalidCall);
            continue;
          }

          //console.log("Collection instantiated OK from " + remark.remark);
          const pubkey = decodeAddress(remark.caller);
          const id = C100.generateId(u8aToHex(pubkey), c.symbol);

          if (this.collections.find((el) => el.id === c.id)) {
            this.invalidCalls.push({
              message: "[MINT] Attempt to mint already existing collection",
              caller: remark.caller,
              object_id: c.id,
              block: remark.block,
              op_type: "MINT",
            } as InvalidCall);
            continue;
          }
          if (id.toLowerCase() !== c.id.toLowerCase()) {
            this.invalidCalls.push({
              message: `Caller's pubkey ${u8aToHex(
                pubkey
              )} (${id}) does not match generated ID`,
              caller: remark.caller,
              object_id: c.id,
              block: remark.block,
              op_type: "MINT",
            } as InvalidCall);
            continue;
          }

          this.collections.push(c);
          break;
        case "MINTNFT":
          // A new NFT was minted into a collection
          console.log("Instantiating nft");
          const n = N100.fromRemark(remark.remark, remark.block);
          if (typeof n === "string") {
            this.invalidCalls.push({
              message: `[MINTNFT] Dead before instantiation: ${n}`,
              caller: remark.caller,
              object_id: remark.remark,
              block: remark.block,
              op_type: "MINTNFT",
            } as InvalidCall);
            continue;
          }
          const nftParent = this.collections.find(
            (el) => el.id === n.collection
          );
          if (!nftParent) {
            this.invalidCalls.push({
              message: `NFT referencing non-existant parent collection ${n.collection}`,
              caller: remark.caller,
              object_id: n.getId(),
              block: remark.block,
              op_type: "MINTNFT",
            } as InvalidCall);
            continue;
          }
          n.owner = nftParent.issuer;
          if (remark.caller != n.owner) {
            this.invalidCalls.push({
              message: `Attempted issue of NFT in non-owned collection. Issuer: ${nftParent.issuer}, caller: ${remark.caller}`,
              caller: remark.caller,
              object_id: n.getId(),
              block: remark.block,
              op_type: "MINTNFT",
            } as InvalidCall);
            continue;
          }
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
          console.log("Instantiating an issuer change");
          const ci = ChangeIssuer.fromRemark(remark.remark);
          if (typeof ci === "string") {
            // console.log(
            //   "ChangeIssuer was not instantiated OK from " + remark.remark
            // );
            this.invalidCalls.push({
              message: `[CHANGEISSUER] Dead before instantiation: ${ci}`,
              caller: remark.caller,
              object_id: remark.remark,
              block: remark.block,
              op_type: "MINT",
            } as InvalidCall);
            continue;
          }
          const coll = this.collections.find((el: C100) => el.id === ci.id);
          if (!coll) {
            console.error(
              `This CHANGEISSUER remark is invalid - no such collection with ID ${ci.id} found before block ${remark.block}!`
            );
          } else {
            coll.addChange({
              field: "issuer",
              old: coll.issuer,
              new: ci.issuer,
              caller: remark.caller,
              block: remark.block,
              valid: remark.caller == coll.issuer, // RESTRICTION
            } as Change);
            coll.issuer = ci.issuer;
          }
          break;
        default:
          console.error(
            "Unable to process this remark - wrong type: " +
              remark.interaction_type
          );
          continue;
      }
    }
    deeplog(this.nfts);
    deeplog(this.collections);
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
