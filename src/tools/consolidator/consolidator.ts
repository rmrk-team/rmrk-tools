import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { Send } from "../../rmrk1.0.0/classes/send";
import { Emote } from "../../rmrk1.0.0/classes/emote";
import { Change } from "../../rmrk1.0.0/changelog";
import { deeplog } from "../utils";
import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { Remark } from "./remark";
import { OP_TYPES } from "../types";
// import * as fs from "fs";

export class Consolidator {
  private adapter?: JsonAdapter;
  private invalidCalls: InvalidCall[];
  private collections: C100[];
  private nfts: N100[];
  constructor(initializedAdapter?: JsonAdapter) {
    if (initializedAdapter) {
      this.adapter = initializedAdapter;
    }

    this.invalidCalls = [];
    this.collections = [];
    this.nfts = [];
  }
  private findExistingCollection(id: string) {
    return this.collections.find((el) => el.id === id);
  }
  private updateInvalidCalls(op_type: OP_TYPES, remark: Remark) {
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: remark.caller,
    };
    return function update(
      this: Consolidator,
      object_id: string,
      message: string
    ) {
      this.invalidCalls.push({
        ...invalidCallBase,
        object_id,
        message,
      } as InvalidCall);
    };
  }
  private mint(remark: Remark): boolean {
    // A new collection was created
    console.log("Instantiating collection");
    const invalidate = this.updateInvalidCalls(OP_TYPES.MINT, remark).bind(
      this
    );
    const c = C100.fromRemark(remark.remark, remark.block);

    if (typeof c === "string") {
      // console.log(
      //   "Collection was not instantiated OK from " + remark.remark
      // );
      invalidate(
        remark.remark,
        `[${OP_TYPES.MINT}] Dead before instantiation: ${c}`
      );
      return true;
    }

    //console.log("Collection instantiated OK from " + remark.remark);
    const pubkey = decodeAddress(remark.caller);
    const id = C100.generateId(u8aToHex(pubkey), c.symbol);

    if (this.findExistingCollection(c.id)) {
      invalidate(
        c.id,
        `[${OP_TYPES.MINT}] Attempt to mint already existing collection`
      );
      return true;
    }

    if (id.toLowerCase() !== c.id.toLowerCase()) {
      invalidate(
        c.id,
        `Caller's pubkey ${u8aToHex(
          pubkey
        )} (${id}) does not match generated ID`
      );
      return true;
    }

    this.collections.push(c);
    return false;
  }

  private mintNFT(remark: Remark): boolean {
    // A new NFT was minted into a collection
    console.log("Instantiating nft");
    const invalidate = this.updateInvalidCalls(OP_TYPES.MINTNFT, remark).bind(
      this
    );
    const n = N100.fromRemark(remark.remark, remark.block);

    if (typeof n === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.MINTNFT}] Dead before instantiation: ${n}`
      );
      return true;
    }

    const nftParent = this.findExistingCollection(n.collection);
    if (!nftParent) {
      invalidate(
        n.getId(),
        `NFT referencing non-existant parent collection ${n.collection}`
      );
      return true;
    }

    n.owner = nftParent.issuer;
    if (remark.caller != n.owner) {
      invalidate(
        n.getId(),
        `Attempted issue of NFT in non-owned collection. Issuer: ${nftParent.issuer}, caller: ${remark.caller}`
      );
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
      invalidate(
        n.getId(),
        `[${OP_TYPES.MINTNFT}] Attempt to mint already existing NFT`
      );
      return true;
    }
    if (n.owner === "") {
      invalidate(
        n.getId(),
        `[${OP_TYPES.MINTNFT}] Somehow this NFT still doesn't have an owner.`
      );
      return true;
    }
    this.nfts.push(n);
    return false;
  }

  private send(remark: Remark): boolean {
    // An NFT was sent to a new owner
    console.log("Instantiating send");
    const send = Send.fromRemark(remark.remark);
    const invalidate = this.updateInvalidCalls(OP_TYPES.SEND, remark).bind(
      this
    );
    if (typeof send === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.SEND}] Dead before instantiation: ${send}`
      );
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

    // @todo add condition for transferable!

    if (!nft) {
      invalidate(
        send.id,
        `[${OP_TYPES.SEND}] Attempting to send non-existant NFT ${send.id}`
      );
      return true;
    }

    // Check if allowed to issue send - if owner == caller
    if (nft.owner != remark.caller) {
      invalidate(
        send.id,
        `[${OP_TYPES.SEND}] Attempting to send non-owned NFT ${send.id}, real owner: ${nft.owner}`
      );
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
    const invalidate = this.updateInvalidCalls(OP_TYPES.EMOTE, remark).bind(
      this
    );
    if (typeof emote === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.EMOTE}] Dead before instantiation: ${emote}`
      );
      return true;
    }
    const target = this.nfts.find((el) => el.getId() === emote.id);
    if (!target) {
      invalidate(
        emote.id,
        `[${OP_TYPES.EMOTE}] Attempting to emote on non-existant NFT ${emote.id}`
      );
      return true;
    }
    if (undefined === target.reactions[emote.unicode]) {
      target.reactions[emote.unicode] = [];
    }
    const index = target.reactions[emote.unicode].indexOf(remark.caller, 0);
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
    const invalidate = this.updateInvalidCalls(
      OP_TYPES.CHANGEISSUER,
      remark
    ).bind(this);
    if (typeof ci === "string") {
      // console.log(
      //   "ChangeIssuer was not instantiated OK from " + remark.remark
      // );
      invalidate(
        remark.remark,
        `[${OP_TYPES.CHANGEISSUER}] Dead before instantiation: ${ci}`
      );
      return true;
    }
    const coll = this.collections.find((el: C100) => el.id === ci.id);
    if (!coll) {
      invalidate(
        ci.id,
        `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such collection with ID ${ci.id} found before block ${remark.block}!`
      );
      return true;
    }

    if (remark.caller != coll.issuer) {
      invalidate(
        ci.id,
        `Attempting to change issuer of collection ${ci.id} when not issuer!`
      );
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
    return false;
  }

  public consolidate(rmrks?: Remark[]): void {
    const remarks = rmrks || this.adapter?.getRemarks() || [];
    //console.log(remarks);
    for (const remark of remarks) {
      console.log("==============================");
      console.log("Remark is: " + remark.remark);
      switch (remark.interaction_type) {
        case OP_TYPES.MINT:
          if (this.mint(remark)) {
            continue;
          }
          break;

        case OP_TYPES.MINTNFT:
          if (this.mintNFT(remark)) {
            continue;
          }
          break;

        case OP_TYPES.SEND:
          if (this.send(remark)) {
            continue;
          }
          break;

        case OP_TYPES.BUY:
          // An NFT was bought after being LISTed
          break;

        case OP_TYPES.LIST:
          // An NFT was listed for sale
          break;

        case OP_TYPES.EMOTE:
          if (this.emote(remark)) {
            continue;
          }
          break;

        case OP_TYPES.CHANGEISSUER:
          if (this.changeIssuer(remark)) {
            continue;
          }
          break;

        default:
          console.error(
            "Unable to process this remark - wrong type: " +
              remark.interaction_type
          );
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
