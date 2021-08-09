import { NFTMetadata } from "../classes/nft";
import { CollectionMetadata } from "../classes/collection";
import {
  optional,
  pattern,
  string,
  type,
  any,
  assert,
  object,
  enums,
  record,
  literal,
} from "superstruct";
import { IProperties } from "./types";

const MetadataStruct = type({
  name: optional(string()),
  description: optional(string()),
  image: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  animation_url: optional(
    pattern(string(), new RegExp("^(https?|ipfs)://.*$"))
  ),
  image_data: optional(string()),
  background_color: optional(string()),
  youtube_url: optional(pattern(string(), new RegExp("^https://.*$"))),
  attributes: any(),
  external_url: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

export const PropertiesStruct = object({
  value: any(),
  type: enums(["string", "array", "object", "int", "float"]),
  _mutable: optional(literal("freeze")),
});

export const validateAttributes = (properties?: IProperties) => {
  if (!properties) {
    return true;
  }
  assert(properties, record(string(), PropertiesStruct));

  Object.values(properties).forEach((attribute) => {
    const { value, type, _mutator } = attribute;
    if (type === "string") {
      if (typeof value !== "string") {
        throw new Error("for type 'string' 'value' has to be a string");
      }
    }

    if (type === "int" || type === "float") {
      if (typeof value !== "number") {
        throw new Error("for type 'number' 'value' has to be a number");
      }
    }

    if (type === "array") {
      if (!Array.isArray(value)) {
        throw new Error("for type 'array' 'value' has to be an array");
      }
    }

    if (type === "object") {
      if (typeof value !== "object") {
        throw new Error("for type 'object' 'value' has to be an Object");
      }
    }
  });

  return true;
};

/**
 * Validate Metadata according to OpenSea docs
 * https://docs.opensea.io/docs/metadata-standards
 * @param metadata
 */
export const validateMetadata = (
  metadata: NFTMetadata | CollectionMetadata
) => {
  assert(metadata, MetadataStruct);

  if (!metadata.image && !(metadata as NFTMetadata).animation_url) {
    throw new Error("image or animation_url is missing");
  }

  validateAttributes(metadata.properties);
  return true;
};
