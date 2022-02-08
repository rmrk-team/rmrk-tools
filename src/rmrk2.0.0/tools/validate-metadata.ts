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
  boolean,
} from "superstruct";
import { IProperties, Metadata } from "./types";
import { OP_TYPES } from "./constants";

const MetadataStruct = type({
  name: optional(string()),
  description: optional(string()),
  image: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  image_data: optional(string()),
  properties: any(),
  external_url: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

export const PropertiesStruct = object({
  value: any(),
  type: enums(["string", "array", "object", "int", "float"]),
  _mutation: optional(
    object({
      allowed: boolean(),
      with: optional(
        object({
          opType: enums([
            "BUY",
            "LIST",
            "CREATE",
            "MINT",
            "SEND",
            "EMOTE",
            "CHANGEISSUER",
            "BURN",
            "BASE",
            "EQUIPPABLE",
            "THEMEADD",
            "RESADD",
            "ACCEPT",
            "ACCEPT",
            "EQUIP",
            "SETPROPERTY",
            "SETPRIORITY",
          ] as OP_TYPES[]),
          condition: optional(string()),
        })
      ),
    })
  ),
});

export const validateAttributes = (properties?: IProperties) => {
  if (!properties) {
    return true;
  }
  assert(properties, record(string(), PropertiesStruct));

  Object.values(properties).forEach((property) => {
    const { value, type } = property;
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
export const validateMetadata = (metadata: Metadata) => {
  assert(metadata, MetadataStruct);

  if (!metadata.image) {
    throw new Error("image is missing");
  }

  validateAttributes(metadata.properties);
  return true;
};
