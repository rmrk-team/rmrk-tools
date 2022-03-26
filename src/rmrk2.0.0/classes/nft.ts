import { Change } from "../changelog";
import { validateNFT } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { nanoid } from "nanoid";
import { AcceptEntityType } from "./accept";
import { isValidEmoji } from "../tools/validate-emoji";
import { EMOTE_NAMESPACES } from "./emote";
import { IProperties } from "../tools/types";
import { Theme } from "./base";
import { isValidAddressPolkadotAddress } from "../tools/consolidator/utils";
import { encodeAddress } from "@polkadot/keyring";

interface INftInstanceProps {
  block: number;
  collection: string;
  symbol: string;
  transferable: number;
  sn: string;
  metadata?: string;
  owner?: string;
  rootowner?: string;
  properties?: IProperties;
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
  properties?: IProperties;
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
    this.rootowner = nftInstance.rootowner || "";
    this.reactions = {};
    this.forsale = BigInt(0);
    this.burned = "";
    this.properties = nftInstance.properties || undefined;
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
        properties: this.properties,
      })
    )}${recipient ? "::" + recipient.replace(/\\s/g, "") : ""}`;
  }

  public send(recipient: string): string {
    if (!this.block) {
      throw new Error(
        "You can only send an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
    return NFT.sendById(this.getId(), recipient);
  }

  static sendById(id: string, recipient: string): string {
    return `${PREFIX}::${OP_TYPES.SEND}::${VERSION}::${id}::${recipient.replace(
      /\\s/g,
      ""
    )}`;
  }

  static listById(id: string, price: bigint | number): string {
    return `${PREFIX}::${OP_TYPES.LIST}::${VERSION}::${id}::${
      price > 0 ? price : 0
    }`;
  }

  static burnById(id: string): string {
    return `${PREFIX}::${OP_TYPES.BURN}::${VERSION}::${id}`;
  }

  static fromRemark(
    remark: string,
    block?: number,
    ss58Format?: number
  ): NFT | string {
    if (!block) {
      block = 0;
    }
    try {
      validateNFT(remark);
      const [prefix, op_type, version, dataString, recipient] = remark.split(
        "::"
      );
      let recipientEncoded = recipient;
      if (isValidAddressPolkadotAddress(recipient)) {
        recipientEncoded = encodeAddress(recipient, ss58Format);
      }
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
        owner: recipientEncoded,
        rootowner: isValidAddressPolkadotAddress(recipientEncoded)
          ? recipientEncoded
          : undefined,
        properties: obj.properties || {},
      });
    } catch (e: any) {
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
    return NFT.listById(this.getId(), price);
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
    return NFT.burnById(this.getId());
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

  public resadd(resource: RessAddResouce): string {
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
   * @param key -property key
   * @param value - aproperty value
   */
  public setproperty(key: string, value: any, freeze?: "freeze"): string {
    if (!this.block) {
      throw new Error("You can only set property on an existing NFT.");
    }
    const isMutable = this.properties?.[key]?._mutation?.allowed;
    if (!isMutable) {
      throw new Error(`The property "${key}" cannot be mutated`);
    }
    return `${PREFIX}::${
      OP_TYPES.SETPROPERTY
    }::${VERSION}::${this.getId()}::${encodeURIComponent(
      key
    )}::${encodeURIComponent(JSON.stringify(value))}${
      freeze ? "::" + freeze : ""
    }`;
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

export interface Reactionmap {
  [unicode: string]: string[];
}

export interface RessAddResouce {
  id?: string;
  base?: string;
  src?: string;
  parts?: string[];
  metadata?: string;
  slot?: string;
  thumb?: string;
  theme?: Theme;
  themeId?: string;
}

export interface Resource extends RessAddResouce {
  pending?: boolean;
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
  theme?: Theme;
  themeId?: string;
}

export interface NFTChild {
  id: string;
  equipped: string;
  pending: boolean;
}
