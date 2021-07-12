import { NFTMetadata } from "../rmrk1.0.0/classes/nft";
import { CollectionMetadata } from "../rmrk1.0.0/classes/collection";
import {
  number,
  optional,
  pattern,
  string,
  type,
  any,
  assert,
  object,
  union,
  enums,
  array,
} from "superstruct";
import { Attribute } from "../types";

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

const AttributeStruct = object({
  value: union([string(), number()]),
  trait_type: optional(string()),
  display_type: optional(
    enums(["boost_number", "boost_percentage", "number", "date"])
  ),
  max_value: optional(number()),
});

export const validateAttributes = (attributes?: Attribute[]) => {
  if (!attributes) {
    return true;
  }
  assert(attributes, array(AttributeStruct));

  attributes.forEach((attribute) => {
    const { value, display_type, max_value } = attribute;
    if (
      display_type === "boost_number" ||
      display_type === "boost_percentage" ||
      display_type === "number" ||
      display_type === "date"
    ) {
      if (typeof value !== "number") {
        throw new Error(
          "for 'boost_number' | 'boost_percentage' | 'number' | 'date' attributes 'value' has to be a number"
        );
      }
    }

    if (max_value && max_value > 0) {
      if (value > max_value) {
        throw new Error("'value' cannot be greater than 'max_value'");
      }
    }

    if (
      typeof value === "number" &&
      (!display_type ||
        !["boost_number", "boost_percentage", "number", "date"].includes(
          display_type
        ))
    ) {
      throw new Error(
        "'value' of type number can only be paired with appropriate 'display_type'"
      );
    }

    if (display_type === "date") {
      const date = new Date(value);
      if (!(date instanceof Date) || date.getFullYear() < 1971) {
        throw new Error(
          "when 'display_type' is 'date', then 'value' has to be of unix timestamp type"
        );
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

  validateAttributes(metadata.attributes);
  return true;
};
