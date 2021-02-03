// @todo: add data!
import { Change } from "../changelog";

export class Collection {
  readonly block: number;
  readonly version: string;
  readonly name: string;
  readonly max: number;
  issuer: string;
  readonly symbol: string;
  readonly id: string;
  readonly metadata: string;
  static V = "RMRK1.0.0";
  private changes: Change[] = [];
  loadedMetadata?: CollectionMetadata;

  constructor(
    block: number,
    name: string,
    max: number,
    issuer: string,
    symbol: string,
    id: string,
    metadata: string
  ) {
    this.block = block;
    this.name = name;
    this.max = max;
    this.issuer = issuer;
    this.symbol = symbol;
    this.id = id;
    this.metadata = metadata;
    this.version = Collection.V;
  }

  public mint(): string {
    if (this.block) {
      throw new Error("An already existing collection cannot be minted!");
    }
    return `RMRK::MINT::${this.version}::${encodeURIComponent(
      JSON.stringify({
        version: this.version,
        name: this.name,
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
        "This collection is new, so there's no issuer to change." +
          " If it has been deployed on chain, load the existing " +
          "collection as a new instance first, then change issuer."
      );
    }
    return `RMRK::CHANGEISSUER::${this.version}::${this.id}::${address}`;
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
    //console.log(pubkey);
    return (
      pubkey.substr(2, 10) +
      pubkey.substring(pubkey.length - 8) +
      "-" +
      symbol.toUpperCase()
    );
  }

  static fromRemark(remark: string, block?: number): Collection | string {
    if (!block) {
      block = 0;
    }
    const exploded = remark.split("::");
    try {
      if (exploded[0].toUpperCase() != "RMRK")
        throw new Error("Invalid remark - does not start with RMRK");
      if (exploded[1] != "MINT")
        throw new Error("The op code needs to be MINT, is " + exploded[1]);
      if (exploded[2] != Collection.V) {
        throw new Error(
          `This remark was issued under version ${exploded[2]} instead of ${Collection.V}`
        );
      }
      const data = decodeURIComponent(exploded[3]);
      const obj = JSON.parse(data);
      if (!obj) throw new Error(`Could not parse object from: ${data}`);
      if (obj.version != Collection.V)
        throw new Error(
          `This collection has a version of ${obj.version} instead of ${Collection.V}`
        );
      if (
        undefined === obj.metadata ||
        (!obj.metadata.startsWith("ipfs") && !obj.metadata.startsWith("http"))
      )
        throw new Error(`Invalid metadata - not an HTTP or IPFS URL`);
      if (undefined === obj.name) throw new Error(`Missing field: name`);
      if (undefined === obj.max) throw new Error(`Missing field: max`);
      if (undefined === obj.issuer) throw new Error(`Missing field: issuer`);
      if (undefined === obj.symbol) throw new Error(`Missing field: symbol`);
      if (undefined === obj.id) throw new Error(`Missing field: id`);
      if (undefined === obj.version) throw new Error(`Missing field: version`);
      return new this(
        block,
        obj.name,
        obj.max,
        obj.issuer,
        obj.symbol,
        obj.id,
        obj.metadata
      );
    } catch (e) {
      console.error(e.message);
      console.log(`MINT error: full input was ${remark}`);
      return e.message;
    }
  }

  /**
   * TBD - hard dependency on Axios / IPFS to fetch remote
   */
  private async load_metadata(): Promise<CollectionMetadata> {
    if (this.loadedMetadata) return this.loadedMetadata;
    return {} as CollectionMetadata;
  }
}

export interface CollectionMetadata {
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
