import { Attribute } from "../types/attribute";

export interface Collection {
  readonly version: string;
  readonly name: string;
  readonly max: number;
  readonly issuer: string;
  readonly symbol: string;
  readonly id: string;
  readonly metadata: CollectionMetadata;
  mint(): Collection;
  change_issuer(): Collection;
}

export interface CollectionMetadata {
  description?: string;
  attributes: Attribute[];
  external_url?: string;
  image?: string;
  image_data?: string;
}
