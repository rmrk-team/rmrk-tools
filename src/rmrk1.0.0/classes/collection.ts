export class Collection {
  readonly block: number;
  readonly version: string;
  readonly name: string;
  readonly max: number;
  readonly issuer: string;
  readonly symbol: string;
  readonly id: string;
  readonly metadata: string;
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
    this.version = "1.0.0";
  }

  public mint(): string {
    if (this.block) {
      throw new Error("An already existing collection cannot be minted!");
    }
    return `RMRK::MINT::${this.version}::${encodeURI(
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

  static generateId(pubkey: string, symbol: string) {
    if (!pubkey.startsWith("0x")) {
      throw new Error("This is not a valid pubkey, it does not start with 0x");
    }
    console.log(pubkey);
    return (
      pubkey.substr(2, 10) +
      pubkey.substring(pubkey.length - 8) +
      "-" +
      symbol.toUpperCase()
    );
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
