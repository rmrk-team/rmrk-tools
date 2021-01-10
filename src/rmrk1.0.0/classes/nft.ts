export class NFT {
  readonly block: number;
  readonly collection: string;
  readonly name: string;
  readonly instance: string;
  readonly transferable: number;
  readonly sn: string;
  readonly metadata: string;
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
