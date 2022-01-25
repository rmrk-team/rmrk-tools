import { Change } from "../changelog";
import { validateCollection } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { IProperties } from "../tools/types";

export class Collection {
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
      throw new Error("An already existing collection cannot be created!");
    }
    return `${PREFIX}::${OP_TYPES.CREATE}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        max: this.max,
        issuer: this.issuer,
        symbol: this.symbol.toUpperCase(),
        id: this.id,
        metadata: this.metadata,
      })
    )}`;
  }

  public destroy(): string {
    if (this.block === 0) {
      throw new Error(
        "This collection is new" +
          " If it has been deployed on chain, load the existing " +
          "collection as a new instance first, then destroy it."
      );
    }
    return `${PREFIX}::${OP_TYPES.DESTROY}::${VERSION}::${this.id}`;
  }

  public change_issuer(address: string): string {
    if (this.block === 0) {
      throw new Error(
        "This collection is new, so there's no issuer to change." +
          " If it has been deployed on chain, load the existing " +
          "collection as a new instance first, then change issuer."
      );
    }
    return `${PREFIX}::${OP_TYPES.CHANGEISSUER}::${VERSION}::${this.id}::${address}`;
  }

  public lock(): string {
    if (this.block === 0) {
      throw new Error(
        "This collection is new" +
          " If it has been deployed on chain, load the existing " +
          "collection as a new instance first, then lock it."
      );
    }
    return `${PREFIX}::${OP_TYPES.LOCK}::${VERSION}::${this.id}`;
  }

  public addChange(c: Change): Collection {
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

  static fromRemark(remark: string, block = 0): Collection | string {
    try {
      validateCollection(remark);
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
    } catch (e: any) {
      console.error(e.message);
      console.log(`${OP_TYPES.CREATE} error: full input was ${remark}`);
      return e.message;
    }
  }
}

export interface CollectionMetadata {
  name?: string;
  description?: string;
  properties: IProperties;
  external_url?: string;
  image?: string;
  image_data?: string;
}
