import { Change } from "../changelog";
import { validateNftclass } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, VERSION } from "../tools/constants";

export class NftClass {
  readonly block: number;
  readonly max: number;
  issuer: string;
  readonly symbol: string;
  readonly id: string;
  readonly metadata: string;
  changes: Change[] = [];

  constructor(
    block: number,
    max: number,
    issuer: string,
    symbol: string,
    id: string,
    metadata: string
  ) {
    this.block = block;
    this.max = max;
    this.issuer = issuer;
    this.symbol = symbol;
    this.id = id;
    this.metadata = metadata;
  }

  public create(): string {
    if (this.block) {
      throw new Error("An already existing nft class cannot be created!");
    }
    return `RMRK::${OP_TYPES.CREATE}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        max: this.max,
        issuer: this.issuer,
        symbol: this.symbol.toUpperCase(),
        id: this.id,
        metadata: this.metadata,
      })
    )}`;
  }

  public change_issuer(address: string): string {
    if (this.block === 0) {
      throw new Error(
        "This nft class is new, so there's no issuer to change." +
          " If it has been deployed on chain, load the existing " +
          "nft class as a new instance first, then change issuer."
      );
    }
    return `RMRK::CHANGEISSUER::${VERSION}::${this.id}::${address}`;
  }

  public addChange(c: Change): NftClass {
    this.changes.push(c);
    return this;
  }

  public getChanges(): Change[] {
    return this.changes;
  }

  static generateId(pubkey: string, symbol: string): string {
    if (!pubkey.startsWith("0x")) {
      throw new Error("This is not a valid pubkey, it does not start with 0x");
    }
    return (
      pubkey.substr(2, 10) +
      pubkey.substring(pubkey.length - 8) +
      "-" +
      symbol.toUpperCase()
    );
  }

  static fromRemark(remark: string, block = 0): NftClass | string {
    try {
      validateNftclass(remark);
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this(
        block,
        obj.max,
        obj.issuer,
        obj.symbol,
        obj.id,
        obj.metadata
      );
    } catch (e) {
      console.error(e.message);
      console.log(`${OP_TYPES.CREATE} error: full input was ${remark}`);
      return e.message;
    }
  }
}

export interface NftclassMetadata {
  description?: string;
  attributes: Attribute[];
  external_url?: string;
  image?: string;
  image_data?: string;
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
