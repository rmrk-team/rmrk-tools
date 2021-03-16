// @todo add data field
import { Change } from "../changelog";
import { validateNFT } from "../../tools/validate-remark";
import { getRemarkData } from "../../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../../tools/constants";

export class NFT {
  readonly block: number;
  readonly collection: string;
  readonly name: string;
  readonly instance: string;
  readonly transferable: number;
  readonly data?: string;
  readonly sn: string;
  readonly metadata?: string;
  forsale: BigInt;
  reactions: Reactionmap;
  changes: Change[] = [];
  owner: string;
  loadedMetadata?: NFTMetadata;
  burned: string;
  constructor(
    block: number,
    collection: string,
    name: string,
    instance: string,
    transferable: number,
    sn: string,
    metadata?: string,
    data?: string
  ) {
    this.block = block;
    this.collection = collection;
    this.name = name;
    this.instance = instance;
    this.transferable = transferable;
    this.sn = sn;
    this.data = data;
    this.metadata = metadata;
    this.owner = "";
    this.reactions = {};
    this.forsale = BigInt(0);
    this.burned = "";
  }

  public getId(): string {
    if (!this.block)
      throw new Error("This token is not minted, so it cannot have an ID.");
    return `${this.block}-${this.collection}-${this.instance}-${this.sn}`;
  }

  public addChange(c: Change): NFT {
    this.changes.push(c);
    return this;
  }

  public mintnft(): string {
    if (this.block) {
      throw new Error("An already existing NFT cannot be minted!");
    }
    return `${PREFIX}::${OP_TYPES.MINTNFT}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        collection: this.collection,
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
    }::${VERSION}::${this.getId()}::${recipient}`;
  }

  // @todo build this out, maybe data type?
  static checkDataFormat(data: string): boolean {
    return true;
  }

  static fromRemark(remark: string, block?: number): NFT | string {
    if (!block) {
      block = 0;
    }
    try {
      validateNFT(remark);
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this(
        block,
        obj.collection,
        obj.name,
        obj.instance,
        typeof obj.transferable === "number"
          ? obj.transferable
          : parseInt(obj.transferable, 10),
        obj.sn,
        obj.metadata,
        obj.data
      );
    } catch (e) {
      console.error(e.message);
      console.log(`MINTNFT error: full input was ${remark}`);
      return e.message;
    }
  }

  /**
   * @param price In plancks, so 10000000000 for 0.01 KSM. Set to 0 if canceling listing.
   */
  public list(price: number): string {
    if (!this.block) {
      throw new Error(
        `You can only list an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`
      );
    }
    return `${PREFIX}::${OP_TYPES.LIST}::${VERSION}::${this.getId()}::${
      price > 0 ? price : "cancel"
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
    return `RMRK::CONSUME::${VERSION}::${this.getId()}`;
  }

  /**
   * TBD - hard dependency on Axios / IPFS to fetch remote
   */
  private async load_metadata(): Promise<NFTMetadata> {
    if (this.loadedMetadata) return this.loadedMetadata;
    return {} as NFTMetadata;
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
