import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100, Reactionmap } from "../../rmrk1.0.0/classes/nft";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { Send } from "../../rmrk1.0.0/classes/send";
import { Emote } from "../../rmrk1.0.0/classes/emote";
import { Change } from "../../rmrk1.0.0/changelog";
import { deeplog } from "../utils";
import * as fs from "fs";

import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";

export class Consolidator {
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

          const existsCheck = this.nfts.find((el) => {
            const idExpand1 = el.getId().split("-");
            idExpand1.shift();
            const uniquePart1 = idExpand1.join("-");

            const idExpand2 = n.getId().split("-");
            idExpand2.shift();
            const uniquePart2 = idExpand2.join("-");

            return uniquePart1 === uniquePart2;
          });

          if (existsCheck) {
            this.invalidCalls.push({
              message: "[MINTNFT] Attempt to mint already existing NFT",
              caller: remark.caller,
              object_id: n.getId(),
              block: remark.block,
              op_type: "MINTNFT",
            } as InvalidCall);
            continue;
          }
          if (n.owner === "") {
            this.invalidCalls.push({
              message:
                "[MINTNFT] Somehow this NFT still doesn't have an owner.",
              caller: remark.caller,
              object_id: n.getId(),
              block: remark.block,
              op_type: "MINTNFT",
            } as InvalidCall);
            continue;
          }
          this.nfts.push(n);
          break;
        case "SEND":
          // An NFT was sent to a new owner
          console.log("Instantiating send");
          const send = Send.fromRemark(remark.remark);
          if (typeof send === "string") {
            this.invalidCalls.push({
              message: `[SEND] Dead before instantiation: ${send}`,
              caller: remark.caller,
              object_id: remark.remark,
              block: remark.block,
              op_type: "SEND",
            } as InvalidCall);
            continue;
          }

          const nft = this.nfts.find((el) => {
            const idExpand1 = el.getId().split("-");
            idExpand1.shift();
            const uniquePart1 = idExpand1.join("-");

            const idExpand2 = send.id.split("-");
            idExpand2.shift();
            const uniquePart2 = idExpand2.join("-");

            return uniquePart1 === uniquePart2;
          });

          if (!nft) {
            this.invalidCalls.push({
              message: `[SEND] Attempting to send non-existant NFT ${send.id}`,
              caller: remark.caller,
              object_id: send.id,
              block: remark.block,
              op_type: "SEND",
            } as InvalidCall);
            continue;
          }
          // Check if allowed to issue send - if owner == caller
          if (nft.owner != remark.caller) {
            this.invalidCalls.push({
              message: `[SEND] Attempting to send non-owned NFT ${send.id}, real owner: ${nft.owner}`,
              caller: remark.caller,
              object_id: send.id,
              block: remark.block,
              op_type: "SEND",
            } as InvalidCall);
            continue;
          }
          nft.addChange({
            field: "owner",
            old: nft.owner,
            new: send.recipient,
            caller: remark.caller,
            block: remark.block,
          } as Change);
          nft.owner = send.recipient;
          break;
        case "BUY":
          // An NFT was bought after being LISTed

          break;
        case "LIST":
          // An NFT was listed for sale

          break;
        case "EMOTE":
          // An EMOTE reaction has been sent
          console.log("Instantiating emote");
          const emote = Emote.fromRemark(remark.remark);
          if (typeof emote === "string") {
            this.invalidCalls.push({
              message: `[EMOTE] Dead before instantiation: ${emote}`,
              caller: remark.caller,
              object_id: remark.remark,
              block: remark.block,
              op_type: "EMOTE",
            } as InvalidCall);
            continue;
          }
          const target = this.nfts.find((el) => el.getId() === emote.id);
          if (!target) {
            this.invalidCalls.push({
              message: `[EMOTE] Attempting to emote on non-existant NFT ${emote.id}`,
              caller: remark.caller,
              object_id: emote.id,
              block: remark.block,
              op_type: "EMOTE",
            } as InvalidCall);
            continue;
          }
          const index = target.reactions[emote.unicode].indexOf(
            remark.caller,
            0
          );
          if (index > -1) {
            target.reactions[emote.unicode].splice(index, 1);
          } else {
            target.reactions[emote.unicode].push(remark.caller);
          }
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
              op_type: "CHANGEISSUER",
            } as InvalidCall);
            continue;
          }
          const coll = this.collections.find((el: C100) => el.id === ci.id);
          if (!coll) {
            this.invalidCalls.push({
              message: `This CHANGEISSUER remark is invalid - no such collection with ID ${ci.id} found before block ${remark.block}!`,
              caller: remark.caller,
              object_id: ci.id,
              block: remark.block,
              op_type: "CHANGEISSUER",
            } as InvalidCall);
            continue;
          }

          if (remark.caller != coll.issuer) {
            this.invalidCalls.push({
              message: `Attempting to change issuer of collection ${ci.id} when not issuer!`,
              caller: remark.caller,
              object_id: ci.id,
              block: remark.block,
              op_type: "CHANGEISSUER",
            } as InvalidCall);
            continue;
          }
          coll.addChange({
            field: "issuer",
            old: coll.issuer,
            new: ci.issuer,
            caller: remark.caller,
            block: remark.block,
          } as Change);
          coll.issuer = ci.issuer;

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
