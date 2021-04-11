import { NFT, NFTMetadata, Reactionmap } from "../../rmrk1.0.0/classes/nft";
import { Change } from "../../rmrk1.0.0/changelog";
import {
  Collection,
  CollectionMetadata,
} from "../../rmrk1.0.0/classes/collection";
import { OP_TYPES } from "../constants";
import { Remark } from "./remark";
import { getCollectionFromRemark, validateMintIds } from "./interactions/mint";
import { sendInteraction } from "./interactions/send";
import { Send } from "../../rmrk1.0.0/classes/send";
import { List } from "../../rmrk1.0.0/classes/list";
import { listForSaleInteraction } from "./interactions/list";
import { Consume } from "../../rmrk1.0.0/classes/consume";
import { consumeInteraction } from "./interactions/consume";
import { Buy } from "../../rmrk1.0.0/classes/buy";
import { buyInteraction } from "./interactions/buy";
import { Emote } from "../../rmrk1.0.0/classes/emote";
import { emoteInteraction } from "./interactions/emote";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { deeplog } from "../utils";
import {
  changeIssuerInteraction,
  getChangeIssuerEntity,
} from "./interactions/changeIssuer";
import { ConsolidatorReturnType } from "../../../dist-cli/src/tools/consolidator/consolidator";
import { validateMintNFT } from "./interactions/mintNFT";

export interface IConsolidatorAdapter {
  updateNFTEmote(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<number>;
  updateNFTList(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<number>;
  updateNFTBuy(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<number>;
  updateNFTSend(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<number>;
  updateNFTConsume(
    nft: NFT,
    consolidatedNFT: NFTConsolidated,
    updatedAtBlock: number
  ): Promise<number>;
  updateNFTMint(nft: NFT, updatedAtBlock: number): Promise<number>;
  updateCollectionMint(collection: CollectionConsolidated): Promise<string>;
  updateCollectionIssuer(
    collection: Collection,
    consolidatedCollection: CollectionConsolidated,
    updatedAtBlock: number
  ): Promise<number>;
  getNFTById(id: string): Promise<NFTConsolidated | undefined>;
  getCollectionById(id: string): Promise<CollectionConsolidated | undefined>;
  getNFTByIdUnique(id: string): Promise<NFTConsolidated | undefined>;
}

export interface NFTConsolidated {
  id: string;
  block: number;
  collection: string;
  name: string;
  instance: string;
  transferable: number;
  sn: string;
  metadata?: string;
  data?: string;
  forsale: BigInt;
  reactions: Reactionmap;
  changes: Change[];
  owner: string;
  loadedMetadata?: NFTMetadata;
  burned: string;
  updatedAtBlock?: number;
}

export interface CollectionConsolidated {
  block: number;
  name: string;
  max: number;
  issuer: string;
  symbol: string;
  id: string;
  metadata: string;
  changes: Change[];
  loadedMetadata?: CollectionMetadata;
}

export const localNFTtoNFTInstance = (nft: NFTConsolidated): NFT => {
  const {
    block,
    collection,
    name,
    instance,
    transferable,
    sn,
    metadata,
    id,
    data,
    updatedAtBlock,
    ...rest
  } = nft || {};
  const nftClass = new NFT(
    block,
    collection,
    name,
    instance,
    transferable,
    sn,
    metadata,
    data,
    updatedAtBlock
  );
  const { owner, forsale, reactions, changes, loadedMetadata, burned } = rest;
  nftClass.owner = owner;
  nftClass.forsale = forsale;
  nftClass.reactions = reactions;
  nftClass.changes = changes;
  nftClass.loadedMetadata = loadedMetadata;
  nftClass.burned = burned;

  return nftClass;
};

export const localCollectiontoCollectionInstance = (
  collection: CollectionConsolidated
): Collection => {
  const { block, name, metadata, id, issuer, max, symbol, ...rest } =
    collection || {};
  const colleactionClass = new Collection(
    block,
    name,
    max,
    issuer,
    symbol,
    id,
    metadata
  );
  const { changes, loadedMetadata } = rest;

  colleactionClass.changes = changes;
  colleactionClass.loadedMetadata = loadedMetadata;

  return colleactionClass;
};

export class Consolidator {
  readonly invalidCalls: InvalidCall[];
  readonly collections: CollectionConsolidated[];
  readonly nfts: NFTConsolidated[];
  readonly dbAdapter?: IConsolidatorAdapter;
  readonly ss58Format?: number;
  constructor(ss58Format?: number, dbAdapter?: IConsolidatorAdapter) {
    if (ss58Format) {
      this.ss58Format = ss58Format;
    }

    if (dbAdapter) {
      this.dbAdapter = dbAdapter;
    }

    this.invalidCalls = [];
    this.collections = [];
    this.nfts = [];
  }

  private async getCollectionById(
    id: string
  ): Promise<CollectionConsolidated | undefined> {
    return this.dbAdapter
      ? await this.dbAdapter.getCollectionById(id)
      : this.collections.find((el) => el.id === id);
  }

  /**
   * Find NFT by compare id on the blockless part
   * To prevent minting a token of the same id in a different block
   */
  private async getNFTByIdUnique(
    id: string
  ): Promise<NFTConsolidated | undefined> {
    return this.dbAdapter
      ? await this.dbAdapter.getNFTByIdUnique(id)
      : this.nfts.find((nft) => {
          const uniquePart1 = nft.id.split("-").slice(1).join("-");
          const uniquePart2 = id.split("-").slice(1).join("-");
          return uniquePart1 === uniquePart2;
        });
  }

  private async getNFTById(id: string) {
    return this.dbAdapter
      ? await this.dbAdapter.getNFTById(id)
      : this.nfts.find((el) => el.id === id);
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
  private async mint(remark: Remark): Promise<boolean> {
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

    const existingCollection = await this.getCollectionById(collection.id);
    if (existingCollection) {
      invalidate(
        collection.id,
        `[${OP_TYPES.MINT}] Attempt to mint already existing collection`
      );
      return true;
    }

    try {
      validateMintIds(collection, remark);
      if (this.dbAdapter) {
        await this.dbAdapter.updateCollectionMint(collection);
      } else {
        this.collections.push(collection);
      }
    } catch (e) {
      invalidate(collection.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The MINT interaction creates an NFT inside of a Collection.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/mintnft.md
   */
  private async mintNFT(remark: Remark): Promise<boolean> {
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

    const exists = await this.getNFTByIdUnique(nft.getId());

    if (exists) {
      invalidate(
        nft.getId(),
        `[${OP_TYPES.MINTNFT}] Attempt to mint already existing NFT`
      );
      return true;
    }

    const nftParentCollection = await this.getCollectionById(nft.collection);

    const collection = nftParentCollection
      ? localCollectiontoCollectionInstance(nftParentCollection)
      : undefined;

    try {
      validateMintNFT(remark, nft, collection);
      if (this.dbAdapter) {
        await this.dbAdapter.updateNFTMint(nft, remark.block);
      } else {
        this.nfts.push({
          ...nft,
          id: nft.getId(),
        });
      }
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
  private async send(remark: Remark): Promise<boolean> {
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

    const consolidatedNFT = await this.getNFTByIdUnique(sendEntity.id);
    if (!consolidatedNFT) {
      return true;
    }
    const nft = localNFTtoNFTInstance(consolidatedNFT);

    try {
      sendInteraction(remark, sendEntity, nft);
      if (this.dbAdapter) {
        await this.dbAdapter.updateNFTSend(nft, consolidatedNFT, remark.block);
      }
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
  private async list(remark: Remark): Promise<boolean> {
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

    const consolidatedNFT = await this.getNFTByIdUnique(listEntity.id);
    if (!consolidatedNFT) {
      return true;
    }
    const nft = localNFTtoNFTInstance(consolidatedNFT);

    try {
      listForSaleInteraction(remark, listEntity, nft);
      if (this.dbAdapter) {
        await this.dbAdapter.updateNFTList(nft, consolidatedNFT, remark.block);
      }
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
  private async consume(remark: Remark): Promise<boolean> {
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
    const consolidatedNFT = await this.getNFTByIdUnique(consumeEntity.id);
    if (!consolidatedNFT) {
      return true;
    }
    const nft = localNFTtoNFTInstance(consolidatedNFT);
    try {
      consumeInteraction(remark, consumeEntity, nft);
      if (this.dbAdapter) {
        await this.dbAdapter.updateNFTConsume(
          nft,
          consolidatedNFT,
          remark.block
        );
      }
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
  private async buy(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.BUY, remark).bind(this);

    const buyEntity = Buy.fromRemark(remark.remark);
    if (typeof buyEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.BUY}] Dead before instantiation: ${buyEntity}`
      );
      return true;
    }

    const consolidatedNFT = await this.getNFTByIdUnique(buyEntity.id);
    if (!consolidatedNFT) {
      return true;
    }
    const nft = localNFTtoNFTInstance(consolidatedNFT);

    try {
      buyInteraction(remark, buyEntity, nft, this.ss58Format);
      if (this.dbAdapter) {
        await this.dbAdapter.updateNFTBuy(nft, consolidatedNFT, remark.block);
      }
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
  private async emote(remark: Remark): Promise<boolean> {
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
    const consolidatedNFT = await this.getNFTById(emoteEntity.id);
    if (!consolidatedNFT) {
      return true;
    }
    const nft = localNFTtoNFTInstance(consolidatedNFT);

    try {
      emoteInteraction(remark, emoteEntity, nft);
      if (this.dbAdapter && remark.block !== consolidatedNFT.updatedAtBlock) {
        await this.dbAdapter.updateNFTEmote(nft, consolidatedNFT, remark.block);
      }
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
  private async changeIssuer(remark: Remark): Promise<boolean> {
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

    const consolidatedCollection = await this.getCollectionById(
      changeIssuerEntity.id
    );
    if (!consolidatedCollection) {
      return true;
    }
    const collection = localCollectiontoCollectionInstance(
      consolidatedCollection
    );
    try {
      changeIssuerInteraction(remark, changeIssuerEntity, collection);
      if (this.dbAdapter) {
        await this.dbAdapter.updateCollectionIssuer(
          collection,
          consolidatedCollection,
          remark.block
        );
      }
    } catch (e) {
      invalidate(changeIssuerEntity.id, e.message);
      return true;
    }

    return false;
  }

  public async consolidate(rmrks?: Remark[]): Promise<ConsolidatorReturnType> {
    const remarks = rmrks || [];
    //console.log(remarks);
    for (const remark of remarks) {
      // console.log('==============================');
      // console.log('Remark is: ' + remark.remark);
      switch (remark.interaction_type) {
        case OP_TYPES.MINT:
          if (await this.mint(remark)) {
            continue;
          }
          break;

        case OP_TYPES.MINTNFT:
          if (await this.mintNFT(remark)) {
            continue;
          }
          break;

        case OP_TYPES.SEND:
          if (await this.send(remark)) {
            continue;
          }
          break;

        case OP_TYPES.BUY:
          // An NFT was bought after being LISTed
          if (await this.buy(remark)) {
            continue;
          }
          break;

        case OP_TYPES.CONSUME:
          // An NFT was burned
          if (await this.consume(remark)) {
            continue;
          }
          break;

        case OP_TYPES.LIST:
          // An NFT was listed for sale
          if (await this.list(remark)) {
            continue;
          }
          break;

        case OP_TYPES.EMOTE:
          if (await this.emote(remark)) {
            continue;
          }
          break;

        case OP_TYPES.CHANGEISSUER:
          if (await this.changeIssuer(remark)) {
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
    // deeplog(this.nfts);
    // deeplog(this.collections);

    //console.log(this.invalidCalls);
    console.log(`${this.nfts.length} NFTs across ${this.collections.length} collections.`);
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
