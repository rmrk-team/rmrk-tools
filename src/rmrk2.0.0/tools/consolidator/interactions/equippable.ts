import { OP_TYPES } from "../../constants";
import { Remark } from "../remark";
import {
  collectionRegexPattern,
  Equippable,
} from "../../../classes/equippable";
import { Base } from "../../../classes/base";

export const equippableInteraction = (
  remark: Remark,
  equippableEntity: Equippable,
  base?: Base
): void => {
  if (!base) {
    throw new Error(
      `[${OP_TYPES.EQUIPPABLE}] Attempting to change equippable on non-existant NFT ${equippableEntity.id}`
    );
  }

  if (!base.parts || !equippableEntity.slot) {
    throw new Error(
      `[${
        OP_TYPES.EQUIPPABLE
      }] Attempting to change equippable on base with no parts or slot is not specified ${base.getId()}`
    );
  }

  // Check if allowed to issue equippable - if issuer == caller
  if (base.issuer != remark.caller) {
    throw new Error(
      `[${
        OP_TYPES.LIST
      }] Attempting to change equippable on non-owned Base ${base.getId()}, real owner: ${
        base.issuer
      }`
    );
  }

  const equippableChangeMatch = equippableEntity.equippableChange.match(
    collectionRegexPattern
  );
  if (!equippableChangeMatch) {
    return;
  }

  const [_, operation, equippableChange] = equippableChangeMatch;

  const partIndex = base.parts.findIndex(
    (part) => part.id === equippableEntity.slot
  );

  if (base.parts[partIndex].type !== "slot") {
    throw new Error(
      `[${OP_TYPES.EQUIPPABLE}] Attempting to change equippable on base part of type ${base.parts[partIndex].type}`
    );
  }

  // Change equippable to allow all nft classes
  if (equippableChange === "*") {
    base.parts[partIndex].equippable = equippableChange;
    return;
  }

  const equippableArray = equippableChange.split(",");
  if (!operation) {
    base.parts[partIndex].equippable = equippableArray;
    return;
  }

  // Remove NFT classes from equippable list
  if (operation === "-") {
    const newEquippableArray: string[] = [];
    (base.parts[partIndex].equippable as string[]).forEach((equippable) => {
      if (!equippableArray.includes(equippable)) {
        newEquippableArray.push(equippable);
      }
    });
    base.parts[partIndex].equippable = newEquippableArray;
    return;
  }

  // Add NFT classes to equippable list
  if (operation === "+") {
    const newEquippableArray = [...base.parts[partIndex].equippable];
    equippableArray.forEach((newEquippable) => {
      if (!newEquippableArray.includes(newEquippable)) {
        newEquippableArray.push(newEquippable);
      }
    });

    base.parts[partIndex].equippable = newEquippableArray;
  }
};
