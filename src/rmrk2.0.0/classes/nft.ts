import { Change } from "../changelog";
import { validateNFT } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";

interface nftInstancerProps {
  block: number;
  nftclass: string;
  name: string;
  instance: string;
  transferable: number;
  sn: string;
  metadata?: string;
  resources?: Resource[];
  priority?: number[];
}

export class NFT {
  readonly block: number;
  readonly nftclass: string;
  readonly name: string;
  readonly instance: string;
  readonly transferable: number;
  readonly resources?: Resource[];
  readonly sn: string;
  readonly metadata?: string;
  forsale: bigint;
  reactions: Reactionmap;
  priority?: number[];
  changes: Change[] = [];
  owner: string;
  children?: NftChild[];
  burned: string;
  constructor(nftInstance: nftInstancerProps) {
    this.block = nftInstance.block;
    this.nftclass = nftInstance.nftclass;
    this.name = nftInstance.name;
    this.instance = nftInstance.instance;
    this.transferable = nftInstance.transferable;
    this.sn = nftInstance.sn;
    this.resources = nftInstance.resources;
    this.metadata = nftInstance.metadata;
    this.priority = nftInstance.priority;
    this.children = [];
    this.owner = "";
    this.reactions = {};
    this.forsale = BigInt(0);
    this.burned = "";
  }

  public getId(): string {
    if (!this.block)
      throw new Error("This token is not minted, so it cannot have an ID.");
    return `${this.block}-${this.nftclass}-${this.instance}-${this.sn}`;
  }

  public addChange(c: Change): NFT {
    this.changes.push(c);
    return this;
  }

  public mintnft(): string {
    if (this.block) {
      throw new Error("An already existing NFT cannot be minted!");
    }
    return `${PREFIX}::${OP_TYPES.MINT}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        nftclass: this.nftclass,
        name: this.name,
        instance: this.instance,
        transferable: this.transferable,
        sn: this.sn,
        metadata: this.metadata,
      })
    )}`;
  }

  public send(recipient: string): string {
    if (!this.block) {
      throw new Error(
        `You can only send an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
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
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this({
        block,
        nftclass: obj.nftclass,
        name: obj.name,
        instance: obj.instance,
        transferable:
          typeof obj.transferable === "number"
            ? obj.transferable
            : parseInt(obj.transferable, 10),
        sn: obj.sn,
        metadata: obj.metadata,
        resources: obj.resources,
        priority: obj.priority
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
        `You can only list an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
      );
    }
    return `${PREFIX}::${OP_TYPES.LIST}::${VERSION}::${this.getId()}::${
      price > 0 ? price : 0
    }`;
  }

  public buy(): string {
    if (!this.block) {
      throw new Error(
        `You can only buy an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
      );
    }
    return `${PREFIX}::${OP_TYPES.BUY}::${VERSION}::${this.getId()}`;
  }

  public consume(): string {
    if (!this.block) {
      throw new Error(
        `You can only consume an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
      );
    }
    return `${PREFIX}::${OP_TYPES.CONSUME}::${VERSION}::${this.getId()}`;
  }

  public emote(unicode: string): string {
    if (!this.block) {
      throw new Error(
        `You can only emote on an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
      );
    }
    return `${PREFIX}::${
      OP_TYPES.EMOTE
    }::${VERSION}::${this.getId()}::${unicode}`;
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

export interface Attribute {
  display_type: DisplayType;
  trait_type: string;
  value: number | string;
}

export enum DisplayType {
  null,
  "boost_number",
  "number",
  "boost_percentage",
}

export interface Reactionmap {
  [unicode: string]: string[];
}

export interface Resource {
  id: string;
  src: string;
}

export interface NftChild {
  id: string;
}
