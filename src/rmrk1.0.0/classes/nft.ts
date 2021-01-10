export class NFT {
  readonly block: number;
  readonly collection: string;
  readonly name: string;
  readonly instance: string;
  readonly transferable: number;
  readonly sn: string;
  readonly metadata: string;
  readonly version: string;
  loadedMetadata?: NFTMetadata;
  constructor(
    block: number,
    collection: string,
    name: string,
    instance: string,
    transferable: number,
    sn: string,
    metadata: string
  ) {
    this.block = block;
    this.collection = collection;
    this.name = name;
    this.instance = instance;
    this.transferable = transferable;
    this.sn = sn;
    this.metadata = metadata;
    this.version = "1.0.0";
  }

  public mintnft(): string {
    if (this.block) {
      throw new Error("An already existing collection cannot be minted!");
    }
    return `RMRK::MINTNFT::${this.version}::${encodeURIComponent(
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
