import { Change } from "../changelog";
import { validateNFT } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import uuid from "uuid-random";

interface nftInstancerProps {
  block: number;
  nftclass: string;
  symbol: string;
  transferable: number;
  sn: string;
  metadata?: string;
  owner?: string;
}

export class NFT {
  readonly block: number;
  readonly nftclass: string;
  readonly symbol: string;
  readonly transferable: number;
  readonly sn: string;
  readonly metadata?: string;
  forsale: bigint;
  reactions: Reactionmap;
  priority: number[];
  changes: Change[] = [];
  owner: string;
  rootowner: string;
  children: Record<string, NFTChild> | null = null;
  resources: IResourceConsolidated[] = [];
  burned: string;
  constructor(nftInstance: nftInstancerProps) {
    this.block = nftInstance.block;
    this.nftclass = nftInstance.nftclass;
    this.symbol = nftInstance.symbol;
    this.transferable = nftInstance.transferable;
    this.sn = nftInstance.sn;
    this.resources = [];
    this.metadata = nftInstance.metadata;
    this.priority = [];
    this.children = null;
    this.owner = nftInstance.owner || "";
    this.rootowner = "";
    this.reactions = {};
    this.forsale = BigInt(0);
    this.burned = "";
  }

  public getId(): string {
    if (!this.block)
      throw new Error("This token is not minted, so it cannot have an ID.");
    return `${this.block}-${this.nftclass}-${this.symbol}-${this.sn}`;
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
        nftclass: this.nftclass,
        symbol: this.symbol,
        transferable: this.transferable,
        sn: this.sn,
        metadata: this.metadata,
      })
    )}${recipient ? "::" + recipient : ""}`;
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
      const [prefix, op_type, version, dataString, recipient] = remark.split(
        "::"
      );
      const obj = getRemarkData(dataString);
      return new this({
        block,
        nftclass: obj.nftclass,
        symbol: obj.symbol,
        transferable:
          typeof obj.transferable === "number"
            ? obj.transferable
            : parseInt(obj.transferable, 10),
        sn: obj.sn,
        metadata: obj.metadata,
        owner: recipient,
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

  public resadd(resource: Resource): string {
    if (!this.block) {
      throw new Error(
        `You can only add resource to an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
      );
    }
    return `${PREFIX}::${
      OP_TYPES.RESADD
    }::${VERSION}::${this.getId()}::${encodeURIComponent(
      JSON.stringify({ ...resource, id: resource.id || uuid() })
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
  id?: string;
  base?: string;
  media?: string;
  metadata?: string;
  slot?: string;
  pending?: boolean;
}

export interface IResourceConsolidated {
  id: string;
  base?: string;
  media?: string;
  metadata?: string;
  slot?: string;
  pending: boolean;
}

export interface NFTChild {
  id: string;
  equipped: string;
  pending: boolean;
}
