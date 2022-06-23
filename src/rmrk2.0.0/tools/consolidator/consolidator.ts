import {
  IResourceConsolidated,
  NFT,
  NFTChild,
  Reactionmap,
} from "../../classes/nft";
import { Change } from "../../changelog";
import { Collection } from "../../classes/collection";
import { OP_TYPES } from "../constants";
import { Remark } from "./remark";
import {
  getCollectionFromRemark,
  validateCreateIds,
} from "./interactions/create";
import { sendInteraction } from "./interactions/send";
import { Send } from "../../classes/send";
import { List } from "../../classes/list";
import { listForSaleInteraction } from "./interactions/list";
import { Burn } from "../../classes/burn";
import { burnInteraction } from "./interactions/burn";
import { Buy } from "../../classes/buy";
import { buyInteraction } from "./interactions/buy";
import { Emote } from "../../classes/emote";
import { emoteInteraction } from "./interactions/emote";
import { ChangeIssuer } from "../../classes/changeissuer";
// import { deeplog } from "../utils";
import { getChangeIssuerEntity } from "./interactions/changeIssuer";
import { validateMintNFT } from "./interactions/mint";
import { InMemoryAdapter } from "./adapters/in-memory-adapter";
import { IConsolidatorAdapter } from "./adapters/types";
import {
  changeIssuerBase,
  changeIssuerCollection,
  consolidatedBasetoInstance,
  consolidatedCollectionToInstance,
  consolidatedNFTtoInstance,
  invalidateIfRecursion,
  isValidAddressPolkadotAddress,
  validateMinBlockBetweenEvents,
} from "./utils";
import { getBaseFromRemark } from "./interactions/base";
import { BaseType, IProperties } from "../types";
import { Base, IBasePart, Theme } from "../../classes/base";
import { equippableInteraction } from "./interactions/equippable";
import { Equippable } from "../../classes/equippable";
import { Resadd } from "../../classes/resadd";
import { resAddInteraction } from "./interactions/resadd";
import { Accept } from "../../classes/accept";
import { acceptInteraction } from "./interactions/accept";
import { Equip } from "../../classes/equip";
import { equipInteraction } from "./interactions/equip";
import { setPriorityInteraction } from "./interactions/setpriority";
import { Setpriority } from "../../classes/setpriority";
import { Setproperty } from "../../classes/setproperty";
import { setPropertyInteraction } from "./interactions/setproperty";
import { Themeadd } from "../../classes/themeadd";
import { themeAddInteraction } from "./interactions/themeadd";
import { Destroy } from "../../classes/destroy";
import { destroyInteraction } from "./interactions/destroy";
import { Lock } from "../../classes/lock";
import { lockInteraction } from "./interactions/lock";
import { encodeAddress } from "@polkadot/keyring";

type InteractionChange = Partial<Record<OP_TYPES, string>> & {
  CHILDREN?: string[];
  RESOURCES?: string[];
};

type InteractionChanges = InteractionChange[];

export type ConsolidatorReturnType = {
  nfts: Record<string, NFTConsolidated>;
  collections: Record<string, CollectionConsolidated>;
  bases: Record<string, BaseConsolidated>;
  invalid: InvalidCall[];
  changes?: InteractionChanges;
  lastBlock?: number;
};

export interface NFTConsolidated {
  id: string;
  block: number;
  collection: string;
  symbol: string;
  transferable: number;
  sn: string;
  metadata?: string;
  forsale: bigint;
  reactions: Reactionmap;
  changes: Change[];
  owner: string;
  rootowner: string;
  burned: string;
  equipped?: string;
  priority: string[];
  children: NFTChild[];
  resources: IResourceConsolidated[];
  properties?: IProperties;
  pending: boolean;
}

export interface CollectionConsolidated {
  block: number;
  max: number;
  issuer: string;
  symbol: string;
  id: string;
  metadata: string;
  changes: Change[];
  count: number;
}

export interface BaseConsolidated {
  block: number;
  symbol: string;
  issuer: string;
  id: string;
  type?: BaseType;
  parts?: IBasePart[];
  changes: Change[];
  themes?: Record<string, Theme>;
  metadata?: string;
}

const invalidateIfParentIsForsale = async (
  nftId: string,
  dbAdapter: IConsolidatorAdapter,
  level = 1
): Promise<boolean> => {
  if (!nftId) {
    throw new Error("invalidateIfParentIsForsale NFT id is missing");
  }
  if (level > 10) {
    throw new Error(
      "Trying to invalidateIfParentIsForsale too deep, possible stack overflow"
    );
  }
  if (isValidAddressPolkadotAddress(nftId)) {
    return true;
  } else {
    const consolidatedNFT = await dbAdapter.getNFTByIdUnique(nftId);

    const nft = consolidatedNFTtoInstance(consolidatedNFT);
    if (!nft) {
      // skip
      return true;
    }

    if (nft.forsale > BigInt(0)) {
      throw new Error(
        `Attempting to do something with an NFT who's parent ${nft.getId()} is listed for sale`
      );
    }

    // Bubble up until owner of nft is polkadot address
    return await invalidateIfParentIsForsale(nft.owner, dbAdapter, level + 1);
  }
};

export class Consolidator {
  readonly invalidCalls: InvalidCall[];
  readonly collections: Collection[];
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
    ss58Format = 2,
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
    this.collections = [];
    this.nfts = [];
    this.bases = [];
  }

  private updateInvalidCalls(op_type: OP_TYPES, remark: Remark) {
    const invalidCallBase: Partial<InvalidCall> = {
      op_type,
      block: remark.block,
      caller: encodeAddress(remark.caller, this.ss58Format),
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
      base = getBaseFromRemark(remark, this.ss58Format);
    } catch (e: any) {
      invalidate(remark.remark, e.message);
      return true;
    }

    const existingBase = await this.dbAdapter.getBaseById(base.getId());
    if (existingBase) {
      invalidate(
        base.getId(),
        `[${OP_TYPES.BASE}] Attempt to create already existing base`
      );
      return true;
    }

    try {
      await this.dbAdapter.updateBase(base);
      this.bases.push(base);
      if (this.emitInteractionChanges) {
        this.interactionChanges.push({ [OP_TYPES.BASE]: base.getId() });
      }
    } catch (e: any) {
      invalidate(base.getId(), e.message);
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

    let collection;
    try {
      collection = getCollectionFromRemark(remark, this.ss58Format);
    } catch (e: any) {
      invalidate(remark.remark, e.message);
      return true;
    }

    const existingCollection = await this.dbAdapter.getCollectionById(
      collection.id
    );
    if (existingCollection) {
      invalidate(
        collection.id,
        `[${OP_TYPES.CREATE}] Attempt to create already existing collection`
      );
      return true;
    }

    try {
      validateCreateIds(collection, remark);
      await this.dbAdapter.updateCollectionMint(collection);
      this.collections.push(collection);
      if (this.emitInteractionChanges) {
        this.interactionChanges.push({ [OP_TYPES.CREATE]: collection.id });
      }
    } catch (e: any) {
      invalidate(collection.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The DESTROY interaction destroys a Collection
   * You can only destroy a collection with no unburned NFTs
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/destroy.md
   */
  private async destroy(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.DESTROY, remark).bind(
      this
    );

    const destroyEntity = Destroy.fromRemark(remark.remark);
    // Check if burn is valid
    if (typeof destroyEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.DESTROY}] Dead before instantiation: ${destroyEntity}`
      );
      return true;
    }

    // Find the Collection in state
    const consolidatedCollection = await this.dbAdapter.getCollectionById(
      destroyEntity.id
    );
    const collection = consolidatedCollectionToInstance(consolidatedCollection);
    try {
      await destroyInteraction(
        remark,
        destroyEntity,
        this.dbAdapter,
        collection
      );
      if (collection) {
        await this.dbAdapter.updateCollectionDestroy(collection);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.DESTROY]: collection.id });
        }
      }
    } catch (e: any) {
      invalidate(destroyEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * The Lock interaction sets max on a Collection to current nft count
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/lock.md
   */
  private async lock(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.LOCK, remark).bind(
      this
    );

    const lockEntity = Lock.fromRemark(remark.remark);
    if (typeof lockEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.LOCK}] Dead before instantiation: ${lockEntity}`
      );
      return true;
    }

    // Find the Collection in state
    const consolidatedCollection = await this.dbAdapter.getCollectionById(
      lockEntity.id
    );
    const collection = consolidatedCollectionToInstance(consolidatedCollection);
    try {
      await lockInteraction(remark, lockEntity, this.dbAdapter, collection);
      if (collection) {
        await this.dbAdapter.updateCollectionLock(collection);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.LOCK]: collection.id });
        }
      }
    } catch (e: any) {
      invalidate(lockEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * The MINT interaction creates an NFT inside of a Collection.
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/mint.md
   */
  private async mint(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.MINT, remark).bind(
      this
    );
    const nft = NFT.fromRemark(remark.remark, remark.block, this.ss58Format);

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

    const nftParentCollection = await this.dbAdapter.getCollectionById(
      nft.collection
    );

    const collection = nftParentCollection
      ? consolidatedCollectionToInstance(nftParentCollection)
      : undefined;

    try {
      if (nft.getId()) {
        await invalidateIfRecursion(nft.getId(), nft.owner, this.dbAdapter);
      }

      await validateMintNFT(remark, nft, this.dbAdapter, collection);
      await this.dbAdapter.updateNFTMint(nft);

      this.nfts.push(nft);
      if (this.emitInteractionChanges) {
        this.interactionChanges.push({ [OP_TYPES.MINT]: nft.getId() });
      }
    } catch (e: any) {
      invalidate(nft.getId(), e.message);
      return true;
    }

    return false;
  }

  /**
   * Send an NFT to an arbitrary recipient.
   * You can only SEND an existing NFT (one that has not been BURNd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/send.md
   */
  private async send(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.SEND, remark).bind(
      this
    );

    const sendEntity = Send.fromRemark(remark.remark, this.ss58Format);

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
      if (nft?.owner) {
        await invalidateIfRecursion(
          sendEntity.id,
          sendEntity.recipient,
          this.dbAdapter
        );
        await invalidateIfParentIsForsale(nft.owner, this.dbAdapter);
      }

      await sendInteraction(remark, sendEntity, this.dbAdapter, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTSend(nft, consolidatedNFT);
        const updatedChildrenIds = await this.dbAdapter.updateNFTChildrenRootOwner(
          nft
        );
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({
            [OP_TYPES.SEND]: nft.getId(),
            CHILDREN: updatedChildrenIds,
          });
        }
      }
    } catch (e: any) {
      invalidate(sendEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * A LIST interaction lists an NFT as available for sale. The NFT can be instantly purchased.
   * A listing can be canceled, and is automatically considered canceled when a BUY is executed on top of a given LIST.
   * You can only LIST an existing NFT (one that has not been BURNd yet).
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
      if (nft?.owner) {
        await invalidateIfParentIsForsale(nft.owner, this.dbAdapter);
      }

      if (consolidatedNFT) {
        validateMinBlockBetweenEvents(OP_TYPES.LIST, consolidatedNFT, remark);
      }

      await listForSaleInteraction(remark, listEntity, this.dbAdapter, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTList(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.LIST]: nft.getId() });
        }
      }
    } catch (e: any) {
      invalidate(listEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * The BURN interaction burns an NFT for a specific purpose.
   * This is useful when NFTs are spendable like with in-game potions, one-time votes in DAOs, or concert tickets.
   * You can only BURN an existing NFT (one that has not been BURNd yet).
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/burn.md
   */
  private async burn(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.BURN, remark).bind(
      this
    );

    const burnEntity = Burn.fromRemark(remark.remark);
    // Check if burn is valid
    if (typeof burnEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.BURN}] Dead before instantiation: ${burnEntity}`
      );
      return true;
    }

    // Find the NFT in state
    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      burnEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);
    try {
      if (nft?.owner) {
        await invalidateIfParentIsForsale(nft.owner, this.dbAdapter);
      }
      await burnInteraction(remark, burnEntity, this.dbAdapter, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTBurn(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.BURN]: nft.getId() });
        }
      }
    } catch (e: any) {
      invalidate(burnEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * The BUY interaction allows a user to immediately purchase an NFT listed for sale using the LIST interaction,
   * as long as the listing hasn't been canceled.
   * You can only BUY an existing NFT (one that has not been BURNd yet).
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
      await buyInteraction(
        remark,
        buyEntity,
        this.dbAdapter,
        nft,
        this.ss58Format
      );
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNFTBuy(nft, consolidatedNFT);
        const updatedChildrenIds = await this.dbAdapter.updateNFTChildrenRootOwner(
          nft
        );
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({
            [OP_TYPES.BUY]: nft.getId(),
            CHILDREN: updatedChildrenIds,
          });
        }
      }
    } catch (e: any) {
      invalidate(buyEntity.id, e.message);
      return true;
    }

    return true;
  }

  /**
   * React to an NFT with an emoticon.
   * You can only EMOTE on an existing NFT (one that has not been BURNd yet).
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
    } catch (e: any) {
      invalidate(emoteEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The CHANGEISSUER interaction allows a collection OR base issuer to change the issuer field to another address.
   * The original issuer immediately loses all rights to mint further NFTs or base parts inside that collection or base.
   * This is particularly useful when selling the rights to a collection's or base operation
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
      changeIssuerEntity = getChangeIssuerEntity(remark, this.ss58Format);
    } catch (e: any) {
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
      // NFT Collection id always starts from block number
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
        // This is NFT Collection change
        await changeIssuerCollection(
          changeIssuerEntity,
          remark,
          onSuccess,
          this.dbAdapter
        );
      }
    } catch (e: any) {
      invalidate(changeIssuerEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The EQUIPPABLE interaction allows a Base owner to modify the list of equippable collectiones on a Base's slot.
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
        `[${OP_TYPES.EQUIPPABLE}] Dead before instantiation: ${equippableEntity}`
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
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.EQUIPPABLE]: base.getId() });
        }
      }
    } catch (e: any) {
      invalidate(equippableEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The RESADD interaction allows anyone to send new resource to a target NFT
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/resadd.md
   */
  private async resadd(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.RESADD, remark).bind(
      this
    );
    const resaddEntity = Resadd.fromRemark(remark.remark, remark.block);
    if (typeof resaddEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.RESADD}] Dead before instantiation: ${resaddEntity}`
      );
      return true;
    }

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      resaddEntity.nftId
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      await resAddInteraction(remark, resaddEntity, this.dbAdapter, nft);
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNftResadd(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.RESADD]: nft.getId() });
        }
      }
    } catch (e: any) {
      invalidate(resaddEntity.nftId, e.message);
      return true;
    }

    return false;
  }

  /**
   * The ACCEPT interaction allows NFT owner to accept pending resource or child NFT new resource toon a target NFT
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/accept.md
   */
  private async accept(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.ACCEPT, remark).bind(
      this
    );
    const acceptEntity = Accept.fromRemark(remark.remark);
    if (typeof acceptEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.ACCEPT}] Dead before instantiation: ${acceptEntity}`
      );
      return true;
    }

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      acceptEntity.nftId
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      const { CHILDREN, RESOURCES } = await acceptInteraction(
        remark,
        acceptEntity,
        this.dbAdapter,
        nft
      );
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateNftAccept(
          nft,
          consolidatedNFT,
          acceptEntity.entity
        );
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({
            [OP_TYPES.ACCEPT]: nft.getId(),
            RESOURCES,
            CHILDREN,
          });
        }
      }
    } catch (e: any) {
      invalidate(acceptEntity.nftId, e.message);
      return true;
    }

    return false;
  }

  /**
   * The EQUIP interaction allows NFT owner to equip another NFT in it's parent's base slot
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/equip.md
   */
  private async equip(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.EQUIP, remark).bind(
      this
    );
    const equipEntity = Equip.fromRemark(remark.remark);
    if (typeof equipEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.EQUIP}] Dead before instantiation: ${equipEntity}`
      );
      return true;
    }

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      equipEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);
    const consolidatedParentNFT = await this.dbAdapter.getNFTByIdUnique(
      nft?.owner || ""
    );
    const parentNft = consolidatedNFTtoInstance(consolidatedParentNFT);

    try {
      await equipInteraction(
        remark,
        equipEntity,
        this.dbAdapter,
        consolidatedNFT,
        parentNft
      );
      if (parentNft && consolidatedParentNFT) {
        await this.dbAdapter.updateEquip(parentNft, consolidatedParentNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.EQUIP]: parentNft.getId() });
        }
      }
    } catch (e: any) {
      invalidate(equipEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The SETPRIORITY interaction allows NFT owner to change resource priority array on NFT
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/setpriority.md
   */
  private async setpriority(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(
      OP_TYPES.SETPRIORITY,
      remark
    ).bind(this);
    const setPriorityEntity = Setpriority.fromRemark(remark.remark);
    if (typeof setPriorityEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.SETPRIORITY}] Dead before instantiation: ${setPriorityEntity}`
      );
      return true;
    }

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      setPriorityEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    try {
      await setPriorityInteraction(
        remark,
        setPriorityEntity,
        this.dbAdapter,
        nft
      );
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateSetPriority(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({ [OP_TYPES.SETPRIORITY]: nft.getId() });
        }
      }
    } catch (e: any) {
      invalidate(setPriorityEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The SETPROPERTY interaction allows NFT owner to change or set new property on NFT
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/setproperty.md
   */
  private async setproperty(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(
      OP_TYPES.SETPROPERTY,
      remark
    ).bind(this);
    const setPropertyEntity = Setproperty.fromRemark(remark.remark);
    if (typeof setPropertyEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.SETPROPERTY}] Dead before instantiation: ${setPropertyEntity}`
      );
      return true;
    }

    const consolidatedNFT = await this.dbAdapter.getNFTByIdUnique(
      setPropertyEntity.id
    );
    const nft = consolidatedNFTtoInstance(consolidatedNFT);

    // Find the Collection in state
    const consolidatedCollection = await this.dbAdapter.getCollectionById(
      nft?.collection || ""
    );
    const collection = consolidatedCollectionToInstance(consolidatedCollection);

    try {
      await setPropertyInteraction(
        remark,
        setPropertyEntity,
        this.dbAdapter,
        nft,
        collection
      );
      if (nft && consolidatedNFT) {
        await this.dbAdapter.updateSetAttribute(nft, consolidatedNFT);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({
            [OP_TYPES.SETPROPERTY]: nft.getId(),
          });
        }
      }
    } catch (e: any) {
      invalidate(setPropertyEntity.id, e.message);
      return true;
    }

    return false;
  }

  /**
   * The THEMEADD interaction allows BASE issuer to add a new theme to a Base
   * https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk2.0.0/interactions/themeadd.md
   */
  private async themeadd(remark: Remark): Promise<boolean> {
    const invalidate = this.updateInvalidCalls(OP_TYPES.THEMEADD, remark).bind(
      this
    );
    const themeAddEntity = Themeadd.fromRemark(remark.remark);
    if (typeof themeAddEntity === "string") {
      invalidate(
        remark.remark,
        `[${OP_TYPES.THEMEADD}] Dead before instantiation: ${themeAddEntity}`
      );
      return true;
    }

    const consolidatedBase = await this.dbAdapter.getBaseById(
      themeAddEntity.baseId
    );
    const base = consolidatedBasetoInstance(consolidatedBase);

    try {
      themeAddInteraction(remark, themeAddEntity, base);
      if (base && consolidatedBase) {
        await this.dbAdapter.updateBaseThemeAdd(base, consolidatedBase);
        if (this.emitInteractionChanges) {
          this.interactionChanges.push({
            [OP_TYPES.THEMEADD]: base.getId(),
          });
        }
      }
    } catch (e: any) {
      invalidate(themeAddEntity.baseId, e.message);
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

        case OP_TYPES.DESTROY:
          if (await this.destroy(remark)) {
            continue;
          }
          break;

        case OP_TYPES.LOCK:
          if (await this.lock(remark)) {
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

        case OP_TYPES.BURN:
          // An NFT was burned
          if (await this.burn(remark)) {
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

        case OP_TYPES.RESADD:
          if (await this.resadd(remark)) {
            continue;
          }
          break;

        case OP_TYPES.ACCEPT:
          if (await this.accept(remark)) {
            continue;
          }
          break;

        case OP_TYPES.EQUIP:
          if (await this.equip(remark)) {
            continue;
          }
          break;

        case OP_TYPES.SETPRIORITY:
          if (await this.setpriority(remark)) {
            continue;
          }
          break;

        case OP_TYPES.SETPROPERTY:
          if (await this.setproperty(remark)) {
            continue;
          }
          break;

        case OP_TYPES.THEMEADD:
          if (await this.themeadd(remark)) {
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
      nfts: this.dbAdapter.getAllNFTs ? await this.dbAdapter.getAllNFTs() : {},
      collections: this.dbAdapter.getAllCollections
        ? await this.dbAdapter.getAllCollections()
        : {},
      bases: this.dbAdapter.getAllBases
        ? await this.dbAdapter.getAllBases()
        : {},
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
