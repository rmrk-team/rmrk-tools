import { NFT, NftChild, Reactionmap, Resource } from "../../classes/nft";
import { Change } from "../../changelog";
import { NftClass } from "../../classes/nft-class";
import { OP_TYPES } from "../constants";
import { Remark } from "./remark";
import {
  getNftclassFromRemark,
  validateCreateIds,
} from "./interactions/create";
import { sendInteraction } from "./interactions/send";
import { Send } from "../../classes/send";
import { List } from "../../classes/list";
import { listForSaleInteraction } from "./interactions/list";
import { Consume } from "../../classes/consume";
import { consumeInteraction } from "./interactions/consume";
import { Buy } from "../../classes/buy";
import { buyInteraction } from "./interactions/buy";
import { Emote } from "../../classes/emote";
import { emoteInteraction } from "./interactions/emote";
import { ChangeIssuer } from "../../classes/changeissuer";
// import { deeplog } from "../utils";
import {
  changeIssuerInteraction,
  getChangeIssuerEntity,
} from "./interactions/changeIssuer";
import { validateMintNFT } from "./interactions/mint";
import { InMemoryAdapter } from "./adapters/in-memory-adapter";
import { IConsolidatorAdapter } from "./adapters/types";
import {
  changeIssuerBase,
  changeIssuerNftClass,
  consolidatedBasetoInstance,
  consolidatedNftclassToInstance,
  consolidatedNFTtoInstance,
} from "./utils";
import { getBaseFromRemark } from "./interactions/base";
import { BaseType } from "../types";
import { Base, IBasePart } from "../../classes/base";
import { equippableInteraction } from "./interactions/equippable";
import { Equippable } from "../../classes/equippable";

type InteractionChanges = Partial<Record<OP_TYPES, string>>[];

export type ConsolidatorReturnType = {
  nfts: NFTConsolidated[];
  nftclasses: NftclassConsolidated[];
  invalid: InvalidCall[];
  changes?: InteractionChanges;
  lastBlock?: number;
};

export interface NFTConsolidated {
  id: string;
  block: number;
  nftclass: string;
  symbol: string;
  transferable: number;
  sn: string;
  metadata?: string;
  forsale: bigint;
  reactions: Reactionmap;
  changes: Change[];
  owner: string;
  burned: string;
  priority: number[];
  children: NftChild[];
  resources: Resource[];
}

export interface NftclassConsolidated {
  block: number;
  max: number;
  issuer: string;
  symbol: string;
  id: string;
  metadata: string;
  changes: Change[];
}

export interface BaseConsolidated {
  block: number;
  issuer: string;
  id: string;
  type: BaseType;
  parts?: IBasePart[];
  changes: Change[];
}

export class Consolidator {
  readonly invalidCalls: InvalidCall[];
  readonly nftclasses: NftClass[];
  readonly bases: Base[];
  readonly nfts: NFT[];
  readonly dbAdapter: IConsolidatorAdapter;
  readonly ss58Format?: number;
  readonly emitEmoteChanges?: boolean;
  readonly emitInteractionChanges?: boolean;
  private interactionChanges: InteractionChanges = [];

  /**
   * @param ss58Format
   * @param dbAdapter
   * @param emitEmoteChanges log EMOTE events in nft 'changes' prop
   * @param emitInteractionChanges return interactions changes ( OP_TYPE: id )
   */
  constructor(
    ss58Format?: number,
    dbAdapter?: IConsolidatorAdapter,
    emitEmoteChanges?: boolean,
    emitInteractionChanges?: boolean
  ) {
    if (ss58Format) {
      this.ss58Format = ss58Format;
    }
    this.emitEmoteChanges = emitEmoteChanges || false;
    this.emitInteractionChanges = emitInteractionChanges || false;

    this.dbAdapter = dbAdapter || new InMemoryAdapter();

    this.invalidCalls = [];
    this.nftclasses = [];
    this.nfts = [];
    this.bases = [];
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
   * The BASE interaction creates a BASE entity.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/base.md
   */
  private async base(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.BASE, remark).bind(
      this
    );

    let base;
    try {
      base = getBaseFromRemark(remark);
    } catch (e) {
      invalidate(remark.remark, e.message);
      return true;
    }

    const existingBase = await this.dbAdapter.getBaseById(base.id);
    if (existingBase) {
      invalidate(
        base.id,
        `[${OP_TYPES.BASE}] Attempt to create already existing base`
      );
      return true;
    }

    try {
      await this.dbAdapter.updateBase(base);
      this.bases.push(base);
      if (this.emitInteractionChanges) {
        this.interactionChanges.push({ [OP_TYPES.BASE]: base.id });
      }
    } catch (e) {
      invalidate(base.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The CREATE interaction creates a NFT class.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/create.md
   */
  private async create(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.CREATE, remark).bind(
      this
    );

    let nftclass;
    try {
      nftclass = getNftclassFromRemark(remark);
    } catch (e) {
      invalidate(remark.remark, e.message);
      return true;
    }

    const existingNftclass = await this.dbAdapter.getNftclassById(nftclass.id);
    if (existingNftclass) {
      invalidate(
        nftclass.id,
        `[${OP_TYPES.CREATE}] Attempt to create already existing nft class`
      );
      return true;
    }

    try {
      validateCreateIds(nftclass, remark);
      await this.dbAdapter.updateNftclassMint(nftclass);
      this.nftclasses.push(nftclass);
      if (this.emitInteractionChanges) {
        this.interactionChanges.push({ [OP_TYPES.CREATE]: nftclass.id });
      }
    } catch (e) {
      invalidate(nftclass.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The MINT interaction creates an NFT inside of a Nftclass.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/mint.md
   */
  private async mint(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.MINT, remark).bind(
      this
    );
    const nft = NFT.fromRemark(remark.remark, remark.block);

    if (typeof nft === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.MINT}] Dead before instantiation: ${nft}`
      );
      return true;
    }

    const exists = await this.dbAdapter.getNFTByIdUnique(nft.getId());

    if (exists) {
      invalidate(
        nft.getId(),
        `[${OP_TYPES.MINT}] Attempt to mint already existing NFT`
      );
      return true;
    }

    const nftParentNftclass = await this.dbAdapter.getNftclassById(
      nft.nftclass
    );

    const nftclass = nftParentNftclass
      ? consolidatedNftclassToInstance(nftParentNftclass)
      : undefined;

    try {
      await validateMintNFT(remark, nft, this.dbAdapter, nftclass);
      await this.dbAdapter.updateNFTMint(nft);

      this.nfts.push(nft);
      if (this.emitInteractionChanges) {
        this.interactionChanges.push({ [OP_TYPES.MINT]: nft.getId() });
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
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/send.md
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

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      sendEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      await sendInteraction(remark, sendEntity, this.dbAdapter, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTSend(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.SEND]: nft.getId() });
        }
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
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/list.md
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

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      listEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      listForSaleInteraction(remark, listEntity, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTList(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.LIST]: nft.getId() });
        }
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
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/consume.md
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
    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      consumeEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);
    try {
      consumeInteraction(remark, consumeEntity, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTConsume(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.CONSUME]: nft.getId() });
        }
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
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/buy.md
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

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(buyEntity.id);
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      buyInteraction(remark, buyEntity, nft, this.ss58Format);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTBuy(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.BUY]: nft.getId() });
        }
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
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/emote.md
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
    const consolidatedNFT = await this.dbAdapter.getNFTById(emoteEntity.id);
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      emoteInteraction(remark, emoteEntity, nft, this.emitEmoteChanges);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTEmote(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.EMOTE]: nft.getId() });
        }
      }
    } catch (e) {
      invalidate(emoteEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The CHANGEISSUER interaction allows a nft class OR base issuer to change the issuer field to another address.
   * The original issuer immediately loses all rights to mint further NFTs or base parts inside that nft class or base.
   * This is particularly useful when selling the rights to a nft class's or base operation
   * or changing the issuer to a null address to relinquish control over it.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/changeissuer.md
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

    try {
      const onSuccess = (id: string) => {
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({
            [OP_TYPES.CHANGEISSUER]: id,
          });
        }
      };
      // NFT Class id always starts from block number
      // Base id always starts with base- prefix
      if (changeIssuerEntity.id.startsWith("base-")) {
        // This is BASE change
        await changeIssuerBase(
          changeIssuerEntity,
          remark,
          onSuccess,
          this.dbAdapter
        );
      } else {
        // This is NFT Class change
        await changeIssuerNftClass(
          changeIssuerEntity,
          remark,
          onSuccess,
          this.dbAdapter
        );
      }
    } catch (e) {
      invalidate(changeIssuerEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The EQUIPPABLE interaction allows a Base owner to modify the list of equippable nft classes on a Base's slot.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/equippable.md
   */
  private async equippable(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(
      OP_TYPES.EQUIPPABLE,
      remark
    ).bind(this);
    const equippableEntity = Equippable.fromRemark(remark.remark);
    if (typeof equippableEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.EMOTE}] Dead before instantiation: ${equippableEntity}`
      );
      return true;
    }
    const consolidatedBase = await this.dbAdapter.getBaseById(
      equippableEntity.id
    );
    const base = consolidatedBasetoInstance(consolidatedBase);

    try {
      equippableInteraction(remark, equippableEntity, base);
      if (base && consolidatedBase) {
        await this.dbAdapter.updateBaseEquippable(base, consolidatedBase);
      }
    } catch (e) {
      invalidate(equippableEntity.id, e.message);
      return true;
    }

    return false;
  }

  public async consolidate(rmrks?: Remark[]): Promise<ConsolidatorReturnType> {
    const remarks = rmrks || [];
    // console.log(remarks);
    for (const remark of remarks) {
      // console.log('==============================');
      // console.log('Remark is: ' + remark.remark);
      switch (remark.interaction_type) {
        case OP_TYPES.CREATE:
          if (await this.create(remark)) {
            continue;
          }
          break;

        case OP_TYPES.MINT:
          if (await this.mint(remark)) {
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

        case OP_TYPES.BASE:
          if (await this.base(remark)) {
            continue;
          }
          break;

        case OP_TYPES.EQUIPPABLE:
          if (await this.equippable(remark)) {
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
    // console.log(
    //   `${this.nfts.length} NFTs across ${this.collections.length} collections.`
    // );
    // console.log(`${this.invalidCalls.length} invalid calls.`);
    const result: ConsolidatorReturnType = {
      nfts: this.dbAdapter.getAllNFTs ? await this.dbAdapter.getAllNFTs() : [],
      nftclasses: this.dbAdapter.getAllNftclasss
        ? await this.dbAdapter.getAllNftclasss()
        : [],
      invalid: this.invalidCalls,
    };
    if (this.emitInteractionChanges) {
      result.changes = this.interactionChanges;
    }
    return result;
  }
}

type InvalidCall = {
  message: string;
  caller: string;
  block: number;
  object_id: string;
  op_type: string;
};
