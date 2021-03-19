import JsonAdapter from "./adapters/json";
import { Collection as C100 } from "../../rmrk1.0.0/classes/collection";
import { NFT, NFT as N100 } from "../../rmrk1.0.0/classes/nft";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { Send } from "../../rmrk1.0.0/classes/send";
import { List } from "../../rmrk1.0.0/classes/list";
import { Buy } from "../../rmrk1.0.0/classes/buy";
import { Consume } from "../../rmrk1.0.0/classes/consume";
import { Emote } from "../../rmrk1.0.0/classes/emote";
import { deeplog } from "../utils";
import { Remark } from "./remark";
import { OP_TYPES } from "../constants";
import { Interaction } from "../types";
import { buyInteraction } from "./interactions/buy";
import { getCollectionFromRemark, validateMintIds } from "./interactions/mint";
import {
  changeIssuerInteraction,
  getChangeIssuerEntity,
} from "./interactions/changeIssuer";
import { validateMintNFT } from "./interactions/mintNFT";
import { listForSaleInteraction } from "./interactions/list";
import { consumeInteraction } from "./interactions/consume";
import { emoteInteraction } from "./interactions/emote";
import { sendInteraction } from "./interactions/send";

export type ConsolidatorReturnType = {
  nfts: N100[];
  collections: C100[];
  invalid: InvalidCall[];
};

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

  /**
   * The MINT interaction creates an NFT collection.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/mint.md
   */
  private mint(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.MINT, remark).bind(
      this
    );

    let collection;
    try {
      collection = getCollectionFromRemark(remark);
    } catch (e) {
      invalidate(remark.remark, e.message);
      return true;
    }

    if (this.findExistingCollection(collection.id)) {
      invalidate(
        collection.id,
        `[${OP_TYPES.MINT}] Attempt to mint already existing collection`
      );
      return true;
    }

    try {
      validateMintIds(collection, remark);
    } catch (e) {
      invalidate(collection.id, e.message);
      return true;
    }

    this.collections.push(collection);
    return false;
  }

  /**
   * The MINT interaction creates an NFT inside of a Collection.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/mintnft.md
   */
  private mintNFT(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.MINTNFT, remark).bind(
      this
    );
    const nft = NFT.fromRemark(remark.remark, remark.block);

    if (typeof nft === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.MINTNFT}] Dead before instantiation: ${nft}`
      );
      return true;
    }

    const existsCheck = this.nfts.find((el) => {
      const idExpand1 = el.getId().split("-");
      idExpand1.shift();
      const uniquePart1 = idExpand1.join("-");

      const idExpand2 = nft.getId().split("-");
      idExpand2.shift();
      const uniquePart2 = idExpand2.join("-");

      return uniquePart1 === uniquePart2;
    });

    if (existsCheck) {
      invalidate(
        nft.getId(),
        `[${OP_TYPES.MINTNFT}] Attempt to mint already existing NFT`
      );
      return true;
    }

    const nftParentCollection = this.findExistingCollection(nft.collection);
    try {
      validateMintNFT(remark, nft, nftParentCollection);
      this.nfts.push(nft);
    } catch (e) {
      invalidate(nft.getId(), e.message);
      return true;
    }

    return false;
  }

  /**
   * Send an NFT to an arbitrary recipient.
   * You can only SEND an existing NFT (one that has not been CONSUMEd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/send.md
   */
  private send(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.SEND, remark).bind(
      this
    );

    const sendEntity = Send.fromRemark(remark.remark);

    if (typeof sendEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.SEND}] Dead before instantiation: ${sendEntity}`
      );
      return true;
    }

    const nft = this.findExistingNFT(sendEntity);

    try {
      sendInteraction(remark, sendEntity, nft);
    } catch (e) {
      invalidate(sendEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * A LIST interaction lists an NFT as available for sale. The NFT can be instantly purchased.
   * A listing can be canceled, and is automatically considered canceled when a BUY is executed on top of a given LIST.
   * You can only LIST an existing NFT (one that has not been CONSUMEd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/list.md
   */
  private list(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.LIST, remark).bind(
      this
    );

    const listEntity = List.fromRemark(remark.remark);

    if (typeof listEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.LIST}] Dead before instantiation: ${listEntity}`
      );
      return true;
    }

    // Find the NFT in state
    const nft = this.findExistingNFT(listEntity);
    try {
      listForSaleInteraction(remark, listEntity, nft);
    } catch (e) {
      invalidate(listEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * The CONSUME interaction burns an NFT for a specific purpose.
   * This is useful when NFTs are spendable like with in-game potions, one-time votes in DAOs, or concert tickets.
   * You can only CONSUME an existing NFT (one that has not been CONSUMEd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/consume.md
   */
  private consume(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.CONSUME, remark).bind(
      this
    );

    const consumeEntity = Consume.fromRemark(remark.remark);
    // Check if consume is valid
    if (typeof consumeEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.CONSUME}] Dead before instantiation: ${consumeEntity}`
      );
      return true;
    }

    // Find the NFT in state
    const nft = this.findExistingNFT(consumeEntity);
    try {
      consumeInteraction(remark, consumeEntity, nft);
    } catch (e) {
      invalidate(consumeEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * The BUY interaction allows a user to immediately purchase an NFT listed for sale using the LIST interaction,
   * as long as the listing hasn't been canceled.
   * You can only BUY an existing NFT (one that has not been CONSUMEd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/buy.md
   */
  private buy(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.BUY, remark).bind(this);

    const buyEntity = Buy.fromRemark(remark.remark);
    if (typeof buyEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.BUY}] Dead before instantiation: ${buyEntity}`
      );
      return true;
    }

    try {
      // Find NFT in current state
      const nft = this.findExistingNFT(buyEntity);
      buyInteraction(remark, buyEntity, nft);
    } catch (e) {
      invalidate(buyEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * React to an NFT with an emoticon.
   * You can only EMOTE on an existing NFT (one that has not been CONSUMEd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/emote.md
   */
  private emote(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(OP_TYPES.EMOTE, remark).bind(
      this
    );
    const emoteEntity = Emote.fromRemark(remark.remark);
    if (typeof emoteEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.EMOTE}] Dead before instantiation: ${emoteEntity}`
      );
      return true;
    }
    const nft = this.nfts.find((el) => el.getId() === emoteEntity.id);

    try {
      emoteInteraction(remark, emoteEntity, nft);
    } catch (e) {
      invalidate(emoteEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The CHANGEISSUER interaction allows a collection issuer to change the issuer field to another address.
   * The original issuer immediately loses all rights to mint further NFTs inside that collection.
   * This is particularly useful when selling the rights to a collection's operation
   * or changing the issuer to a null address to relinquish control over it.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/changeissuer.md
   */
  private changeIssuer(remark: Remark): boolean {
    const invalidate = this.updateInvalidCalls(
      OP_TYPES.CHANGEISSUER,
      remark
    ).bind(this);

    let changeIssuerEntity: ChangeIssuer;
    try {
      changeIssuerEntity = getChangeIssuerEntity(remark);
    } catch (e) {
      invalidate(remark.remark, e.message);
      return true;
    }

    const collection = this.collections.find(
      (el: C100) => el.id === changeIssuerEntity.id
    );
    try {
      changeIssuerInteraction(remark, changeIssuerEntity, collection);
    } catch (e) {
      invalidate(changeIssuerEntity.id, e.message);
      return true;
    }

    return false;
  }

  public consolidate(rmrks?: Remark[]): ConsolidatorReturnType {
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
