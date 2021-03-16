import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { Send } from "../../rmrk1.0.0/classes/send";
import { List } from "../../rmrk1.0.0/classes/list";
import { Buy } from "../../rmrk1.0.0/classes/buy";
import { Consume } from "../../rmrk1.0.0/classes/consume";
import { Emote } from "../../rmrk1.0.0/classes/emote";
import { Change } from "../../rmrk1.0.0/changelog";
import { deeplog } from "../utils";
import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { Remark } from "./remark";
import { OP_TYPES } from "../constants";
import { BlockCall, Interaction } from "../types";
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
  private findExistingNFT(interaction: Interaction): N100 | undefined {
    return this.nfts.find((el) => {
      const idExpand1 = el.getId().split("-");
      idExpand1.shift();
      const uniquePart1 = idExpand1.join("-");

      const idExpand2 = interaction.id.split("-");
      idExpand2.shift();
      const uniquePart2 = idExpand2.join("-");

      return uniquePart1 === uniquePart2;
    });
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

    const nft = this.findExistingNFT(send);
    if (!nft) {
      invalidate(
        send.id,
        `[${OP_TYPES.SEND}] Attempting to send non-existant NFT ${send.id}`
      );
      return true;
    }

    if (nft.burned != "") {
      invalidate(
        send.id,
        `[${OP_TYPES.SEND}] Attempting to send burned NFT ${send.id}`
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

    if (nft.transferable === 0 || nft.transferable >= remark.block) {
      invalidate(
        send.id,
        `[${OP_TYPES.SEND}] Attempting to send non-transferable NFT ${send.id}.`
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

    // Cancel LIST, if any
    if (nft.forsale > BigInt(0)) {
      nft.addChange({
        field: "forsale",
        old: nft.forsale,
        new: BigInt(0),
        caller: remark.caller,
        block: remark.block,
      } as Change);
      nft.forsale = BigInt(0);
    }

    return false;
  }

  private list(remark: Remark): boolean {
    // An NFT was listed for sale
    console.log("Instantiating list");
    const list = List.fromRemark(remark.remark);
    const invalidate = this.updateInvalidCalls(OP_TYPES.LIST, remark).bind(
      this
    );

    if (typeof list === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.LIST}] Dead before instantiation: ${list}`
      );
      return true;
    }

    // Find the NFT in question
    const nft = this.findExistingNFT(list);

    if (!nft) {
      invalidate(
        list.id,
        `[${OP_TYPES.LIST}] Attempting to list non-existant NFT ${list.id}`
      );
      return true;
    }

    if (nft.burned != "") {
      invalidate(
        list.id,
        `[${OP_TYPES.LIST}] Attempting to list burned NFT ${list.id}`
      );
      return true;
    }

    // Check if allowed to issue send - if owner == caller
    if (nft.owner != remark.caller) {
      invalidate(
        list.id,
        `[${OP_TYPES.LIST}] Attempting to list non-owned NFT ${list.id}, real owner: ${nft.owner}`
      );
      return true;
    }

    if (nft.transferable === 0 || nft.transferable >= remark.block) {
      invalidate(
        list.id,
        `[${OP_TYPES.LIST}] Attempting to list non-transferable NFT ${list.id}.`
      );
      return true;
    }

    if (list.price !== nft.forsale) {
      nft.addChange({
        field: "forsale",
        old: nft.forsale,
        new: list.price,
        caller: remark.caller,
        block: remark.block,
      } as Change);
      nft.forsale = list.price;
    }

    return true;
  }

  private consume(remark: Remark): boolean {
    // An NFT was consumed
    console.log("Instantiating consume");
    const burn = Consume.fromRemark(remark.remark);
    const invalidate = this.updateInvalidCalls(OP_TYPES.CONSUME, remark).bind(
      this
    );

    // Check if consume is valid
    if (typeof burn === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.CONSUME}] Dead before instantiation: ${burn}`
      );
      return true;
    }

    // Find the NFT in question
    const nft = this.findExistingNFT(burn);
    if (!nft) {
      invalidate(
        burn.id,
        `[${OP_TYPES.CONSUME}] Attempting to CONSUME non-existant NFT ${burn.id}`
      );
      return true;
    }

    if (nft.burned != "") {
      invalidate(
        burn.id,
        `[${OP_TYPES.CONSUME}] Attempting to burn already burned NFT ${burn.id}`
      );
      return true;
    }

    // Check if burner is owner of NFT
    if (nft.owner != remark.caller) {
      invalidate(
        burn.id,
        `[${OP_TYPES.CONSUME}] Attempting to CONSUME non-owned NFT ${burn.id}`
      );
      return true;
    }

    // Burn and note reason

    let burnReasons: string[] = [];
    // Check if we have extra calls in the batch
    if (remark.extra_ex?.length) {
      // Check if the transfer is valid, i.e. matches target recipient and value.
      remark.extra_ex?.forEach((el: BlockCall) => {
        burnReasons.push(`<consume>${el.value}</consume>`);
      });
    }

    const burnReason = burnReasons.join(",");
    nft.addChange({
      field: "burned",
      old: "",
      new: burnReason,
      caller: remark.caller,
      block: remark.block,
    } as Change);
    nft.burned = burnReason;

    // Delist if listed for sale
    nft.addChange({
      field: "forsale",
      old: nft.forsale,
      new: BigInt(0),
      caller: remark.caller,
      block: remark.block,
    } as Change);
    nft.forsale = BigInt(0);

    return true;
  }

  private buy(remark: Remark): boolean {
    // An NFT was bought after having been LISTed for sale
    console.log("Instantiating buy");
    const buy = Buy.fromRemark(remark.remark);
    const invalidate = this.updateInvalidCalls(OP_TYPES.BUY, remark).bind(this);

    if (typeof buy === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.BUY}] Dead before instantiation: ${buy}`
      );
      return true;
    }

    // Find the NFT in question
    const nft = this.findExistingNFT(buy);

    if (!nft) {
      invalidate(
        buy.id,
        `[${OP_TYPES.BUY}] Attempting to buy non-existant NFT ${buy.id}`
      );
      return true;
    }

    if (nft.burned != "") {
      invalidate(
        buy.id,
        `[${OP_TYPES.BUY}] Attempting to buy burned NFT ${buy.id}`
      );
      return true;
    }

    if (nft.forsale <= BigInt(0)) {
      invalidate(
        buy.id,
        `[${OP_TYPES.BUY}] Attempting to buy not-for-sale NFT ${buy.id}`
      );
      return true;
    }

    if (nft.transferable === 0 || nft.transferable >= remark.block) {
      invalidate(
        buy.id,
        `[${OP_TYPES.BUY}] Attempting to buy non-transferable NFT ${buy.id}.`
      );
      return true;
    }

    // Check if we have extra calls in the batch
    if (remark.extra_ex?.length === 0) {
      invalidate(
        buy.id,
        `[${OP_TYPES.BUY}] No accompanying transfer found for purchase of NFT with ID ${buy.id}.`
      );
      return true;
    } else {
      // Check if the transfer is valid, i.e. matches target recipient and value.
      let transferValid = false;
      let transferValue = "";
      remark.extra_ex?.forEach((el: BlockCall) => {
        if (el.call === "balances.transfer") {
          transferValue = el.value;
          if (el.value === `${nft.owner},${nft.forsale}`) {
            transferValid = true;
          }
        }
      });
      if (!transferValid) {
        invalidate(
          buy.id,
          `[${OP_TYPES.BUY}] Transfer for the purchase of NFT ID ${buy.id} not valid. 
          Recipient, amount should be ${nft.owner},${nft.forsale}, is ${transferValue}.`
        );
        return true;
      }
    }

    nft.addChange({
      field: "owner",
      old: nft.owner,
      new: remark.caller,
      caller: remark.caller,
      block: remark.block,
    } as Change);
    nft.owner = remark.caller;

    nft.addChange({
      field: "forsale",
      old: nft.forsale,
      new: BigInt(0),
      caller: remark.caller,
      block: remark.block,
    } as Change);
    nft.forsale = BigInt(0);

    return true;
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

    if (target.burned != "") {
      invalidate(
        emote.id,
        `[${OP_TYPES.EMOTE}] Cannot emote to a burned NFT ${emote.id}`
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

  public consolidate(
    rmrks?: Remark[]
  ): {
    nfts: N100[];
    collections: C100[];
    invalid: InvalidCall[];
  } {
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
          if (this.buy(remark)) {
            continue;
          }
          break;

        case OP_TYPES.CONSUME:
          // An NFT was burned
          if (this.consume(remark)) {
            continue;
          }
          break;

        case OP_TYPES.LIST:
          // An NFT was listed for sale
          if (this.list(remark)) {
            continue;
          }
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

    //console.log(this.invalidCalls);
    console.log(
      `${this.nfts.length} NFTs across ${this.collections.length} collections.`
    );
    console.log(`${this.invalidCalls.length} invalid calls.`);
    return {
      nfts: this.nfts,
      collections: this.collections,
      invalid: this.invalidCalls,
    };
  }
}

type InvalidCall = {
  message: string;
  caller: string;
  block: number;
  object_id: string;
  op_type: string;
};
