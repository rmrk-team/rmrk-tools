import { Change } from "../changelog";
import { validateNFT } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { nanoid } from "nanoid";
import { AcceptEntityType } from "./accept";
import { Attribute } from "../../types";
import { isValidEmoji } from "../tools/validate-emoji";
import { EMOTE_NAMESPACES } from "./emote";

interface INftInstanceProps {
  block: number;
  collection: string;
  symbol: string;
  transferable: number;
  sn: string;
  metadata?: string;
  owner?: string;
  attributes: Attribute[];
}

export class NFT {
  readonly block: number;
  readonly collection: string;
  readonly symbol: string;
  readonly transferable: number;
  readonly sn: string;
  readonly metadata?: string;
  forsale: bigint;
  reactions: Reactionmap;
  priority: string[];
  changes: Change[] = [];
  owner: string;
  rootowner: string;
  children: NFTChild[] = [];
  resources: IResourceConsolidated[] = [];
  burned: string;
  attributes: Attribute[];
  pending: boolean;
  constructor(nftInstance: INftInstanceProps) {
    this.block = nftInstance.block;
    this.collection = nftInstance.collection;
    this.symbol = nftInstance.symbol;
    this.transferable = nftInstance.transferable;
    this.sn = nftInstance.sn;
    this.resources = [];
    this.metadata = nftInstance.metadata;
    this.priority = [];
    this.children = [];
    this.owner = nftInstance.owner || "";
    this.rootowner = "";
    this.reactions = {};
    this.forsale = BigInt(0);
    this.burned = "";
    this.attributes = nftInstance.attributes || undefined;
    this.pending = false;
  }

  public getId(): string {
    if (!this.block)
      throw new Error("This token is not minted, so it cannot have an ID.");
    return `${this.block}-${this.collection}-${this.symbol}-${this.sn}`;
  }

  public addChange(c: Change): NFT {
    this.changes.push(c);
    return this;
  }

  public mint(recipient?: string): string {
    if (this.block) {
      throw new Error("An already existing NFT cannot be minted!");
    }
    return `${PREFIX}::${OP_TYPES.MINT}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        collection: this.collection,
        symbol: this.symbol,
        transferable: this.transferable,
        sn: this.sn,
        metadata: this.metadata,
        attributes: this.attributes,
      })
    )}${recipient ? "::" + recipient.replace(/\\s/g, "") : ""}`;
  }

  public send(recipient: string): string {
    if (!this.block) {
      throw new Error(
        "You can only send an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return `${PREFIX}::${
      OP_TYPES.SEND
    }::${VERSION}::${this.getId()}::${recipient.replace(/\\s/g, "")}`;
  }

  static fromRemark(remark: string, block?: number): NFT | string {
    if (!block) {
      block = 0;
    }
    try {
      validateNFT(remark);
      const [prefix, op_type, version, dataString, recipient] = remark.split(
        "::"
      );
      const obj = getRemarkData(dataString);
      return new this({
        block,
        collection: obj.collection,
        symbol: obj.symbol,
        transferable:
          typeof obj.transferable === "number"
            ? obj.transferable
            : parseInt(obj.transferable, 10),
        sn: obj.sn,
        metadata: obj.metadata,
        owner: recipient,
        attributes: obj.attributes || [],
      });
    } catch (e) {
      console.error(e.message);
      console.log(`MINT error: full input was ${remark}`);
      return e.message;
    }
  }

  /**
   * @param price In plancks, so 10000000000 for 0.01 KSM. Set to 0 if canceling listing.
   */
  public list(price: bigint | number): string {
    if (!this.block) {
      throw new Error(
        "You can only list an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return `${PREFIX}::${OP_TYPES.LIST}::${VERSION}::${this.getId()}::${
      price > 0 ? price : 0
    }`;
  }

  public buy(recipient?: string): string {
    if (!this.block) {
      throw new Error(
        "You can only buy an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return `${PREFIX}::${OP_TYPES.BUY}::${VERSION}::${this.getId()}${
      recipient ? "::" + recipient.replace(/\\s/g, "") : ""
    }`;
  }

  public burn(): string {
    if (!this.block) {
      throw new Error(
        "You can only burn an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return `${PREFIX}::${OP_TYPES.BURN}::${VERSION}::${this.getId()}`;
  }

  public emote(unicode: string, namespace = EMOTE_NAMESPACES.RMRK2): string {
    if (!this.block) {
      throw new Error(
        "You can only emote on an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    if (!isValidEmoji(unicode)) {
      throw new Error(
        `Trying to EMOTE on NFT ${this.getId()} with an invalid emoji unicode ${unicode}`
      );
    }
    return `${PREFIX}::${
      OP_TYPES.EMOTE
    }::${VERSION}::${namespace}::${this.getId()}::${unicode}`;
  }

  public resadd(resource: Resource): string {
    if (!this.block) {
      throw new Error(
        "You can only add resource to an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }

    if (resource.slot && !resource.slot.includes(".")) {
      throw new Error("Base slot is missing dot '.'");
    }

    return `${PREFIX}::${
      OP_TYPES.RESADD
    }::${VERSION}::${this.getId()}::${encodeURIComponent(
      JSON.stringify({ ...resource, id: resource.id || nanoid(8) })
    )}`;
  }

  /**
   *
   * @param id - either child NFT id or resource id to accept from pending state
   */
  public accept(id: string, entity: AcceptEntityType): string {
    if (!this.block) {
      throw new Error(
        "You can only accept resource to an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return `${PREFIX}::${
      OP_TYPES.ACCEPT
    }::${VERSION}::${this.getId()}::${entity}::${id}`;
  }

  /**
   *
   * @param baseslot - base-namespaced slot into which the NFT is to be equipped - base_1.slot_1 or empty string for unequip
   */
  public equip(baseslot: string): string {
    if (!this.block) {
      throw new Error(
        "You can only equip resource to an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return `${PREFIX}::${
      OP_TYPES.EQUIP
    }::${VERSION}::${this.getId()}::${baseslot}`;
  }

  /**
   *
   * @param name - attribute trait_type value
   * @param value - attribute value
   */
  public setattribute(name: string, value: string): string {
    if (!this.block) {
      throw new Error("You can only set attribute on an existing NFT.");
    }
    const isMutable = this.attributes.find(
      (attribute) => attribute.trait_type === name
    )?.mutable;
    if (!isMutable) {
      throw new Error(`The attribute "${name}" cannot be mutated`);
    }
    return `${PREFIX}::${
      OP_TYPES.SETATTRIBUTE
    }::${VERSION}::${this.getId()}::${encodeURIComponent(
      name
    )}::${encodeURIComponent(value)}`;
  }

  /**
   *
   * @param priority - Array of resource ids in the order that they should be displayed in
   */
  public setpriority(priority: string[]): string {
    if (!this.block) {
      throw new Error("You can only set priority on an existing NFT.");
    }
    return `${PREFIX}::${
      OP_TYPES.SETPRIORITY
    }::${VERSION}::${this.getId()}::${encodeURIComponent(
      JSON.stringify(priority)
    )}`;
  }
}

export interface NFTMetadata {
  external_url?: string;
  image?: string;
  image_data?: string;
  description?: string;
  name?: string;
  attributes: Attribute[];
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
}

export interface ResourceMetadata {
  external_url?: string;
  description?: string;
  name?: string;
}

export interface Reactionmap {
  [unicode: string]: string[];
}

export interface Resource {
  id?: string;
  base?: string;
  src?: string;
  parts?: string[];
  metadata?: string;
  slot?: string;
  pending?: boolean;
  thumb?: string;
}

export interface IResourceConsolidated {
  id: string;
  base?: string;
  parts?: string[];
  src?: string;
  thumb?: string;
  metadata?: string;
  slot?: string;
  pending: boolean;
}

export interface NFTChild {
  id: string;
  equipped: string;
  pending: boolean;
}
