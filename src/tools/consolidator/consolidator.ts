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
import { Remark } from "./remark";

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
  private findExistingCollection(id: string) {
    return this.collections.find((el) => el.id === id);
  }
  private mint(remark: Remark): boolean {
    // A new collection was created
    console.log("Instantiating collection");
    const op_type = "MINT";
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: remark.caller,
    };
    const c = C100.fromRemark(remark.remark, remark.block);

    if (typeof c === "string") {
      // console.log(
      //   "Collection was not instantiated OK from " + remark.remark
      // );
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Dead before instantiation: ${c}`,
        object_id: remark.remark,
      } as InvalidCall);
      return true;
    }

    //console.log("Collection instantiated OK from " + remark.remark);
    const pubkey = decodeAddress(remark.caller);
    const id = C100.generateId(u8aToHex(pubkey), c.symbol);

    if (this.findExistingCollection(c.id)) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: "[MINT] Attempt to mint already existing collection",
        object_id: c.id,
      } as InvalidCall);
      return true;
    }

    if (id.toLowerCase() !== c.id.toLowerCase()) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `Caller's pubkey ${u8aToHex(
          pubkey
        )} (${id}) does not match generated ID`,
        object_id: c.id,
      } as InvalidCall);
      return true;
    }

    this.collections.push(c);
    return false;
  }

  private mintNFT(remark: Remark): boolean {
    // A new NFT was minted into a collection
    console.log("Instantiating nft");
    const op_type = "MINTNFT";
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: remark.caller,
    };
    const n = N100.fromRemark(remark.remark, remark.block);

    if (typeof n === "string") {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Dead before instantiation: ${n}`,
        object_id: remark.remark,
      } as InvalidCall);
      return true;
    }

    const nftParent = this.findExistingCollection(n.collection);
    if (!nftParent) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `NFT referencing non-existant parent collection ${n.collection}`,
        object_id: n.getId(),
      } as InvalidCall);
      return true;
    }

    n.owner = nftParent.issuer;
    if (remark.caller != n.owner) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `Attempted issue of NFT in non-owned collection. Issuer: ${nftParent.issuer}, caller: ${remark.caller}`,
        object_id: n.getId(),
      } as InvalidCall);
      return true;
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
        ...invalidCallBase,
        message: `[${op_type}] Attempt to mint already existing NFT`,
        object_id: n.getId(),
      } as InvalidCall);
      return true;
    }
    if (n.owner === "") {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Somehow this NFT still doesn't have an owner.`,
        object_id: n.getId(),
      } as InvalidCall);
      return true;
    }
    this.nfts.push(n);
    return false;
  }

  private send(remark: Remark): boolean {
    // An NFT was sent to a new owner
    console.log("Instantiating send");
    const send = Send.fromRemark(remark.remark);
    const op_type = "SEND";
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: remark.caller,
    };
    if (typeof send === "string") {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Dead before instantiation: ${send}`,
        object_id: remark.remark,
      } as InvalidCall);
      return true;
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
        ...invalidCallBase,
        message: `[${op_type}] Attempting to send non-existant NFT ${send.id}`,
        object_id: send.id,
      } as InvalidCall);
      return true;
    }

    // Check if allowed to issue send - if owner == caller
    if (nft.owner != remark.caller) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Attempting to send non-owned NFT ${send.id}, real owner: ${nft.owner}`,
        object_id: send.id,
      } as InvalidCall);
      return true;
    }

    nft.addChange({
      field: "owner",
      old: nft.owner,
      new: send.recipient,
      caller: remark.caller,
      block: remark.block,
    } as Change);

    nft.owner = send.recipient;
    return false;
  }

  private emote(remark: Remark): boolean {
    // An EMOTE reaction has been sent
    console.log("Instantiating emote");
    const emote = Emote.fromRemark(remark.remark);
    const op_type = "EMOTE";
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: remark.caller,
    };
    if (typeof emote === "string") {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Dead before instantiation: ${emote}`,
        object_id: remark.remark,
      } as InvalidCall);
      return true;
    }
    const target = this.nfts.find((el) => el.getId() === emote.id);
    if (!target) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Attempting to emote on non-existant NFT ${emote.id}`,
        object_id: emote.id,
      } as InvalidCall);
      return true;
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
    return false;
  }

  private changeIssuer(remark: Remark): boolean {
    // The ownership of a collection has changed
    console.log("Instantiating an issuer change");
    const ci = ChangeIssuer.fromRemark(remark.remark);
    const op_type = "CHANGEISSUER";
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: remark.caller,
    };
    if (typeof ci === "string") {
      // console.log(
      //   "ChangeIssuer was not instantiated OK from " + remark.remark
      // );
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `[${op_type}] Dead before instantiation: ${ci}`,
        object_id: remark.remark,
      } as InvalidCall);
      return true;
    }
    const coll = this.collections.find((el: C100) => el.id === ci.id);
    if (!coll) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `This ${op_type} remark is invalid - no such collection with ID ${ci.id} found before block ${remark.block}!`,
        object_id: ci.id,
      } as InvalidCall);
      return true;
    }

    if (remark.caller != coll.issuer) {
      this.invalidCalls.push({
        ...invalidCallBase,
        message: `Attempting to change issuer of collection ${ci.id} when not issuer!`,
        object_id: ci.id,
      } as InvalidCall);
      return true;
    }

    coll.addChange({
      field: "issuer",
      old: coll.issuer,
      new: ci.issuer,
      caller: remark.caller,
      block: remark.block,
    } as Change);

    coll.issuer = ci.issuer;
    return false
  }

  public consolidate(): void {
    const remarks = this.adapter.getRemarks();
    //console.log(remarks);
    for (const remark of remarks) {
      console.log("==============================");
      console.log("Remark is: " + remark.remark);
      switch (remark.interaction_type) {
        case "MINT":
          if (this.mint(remark)) {
            continue;
          }
          break;
        case "MINTNFT":
          if (this.mintNFT(remark)) {
            continue;
          }
          break;
        case "SEND":
          if (this.send(remark)) {
            continue;
          }
          break;
        case "BUY":
          // An NFT was bought after being LISTed

          break;
        case "LIST":
          // An NFT was listed for sale

          break;
        case "EMOTE":
          if (this.emote(remark)) {
            continue;
          }
          break;
        case "CHANGEISSUER":
          if (this.changeIssuer(remark)) {
            continue;
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
