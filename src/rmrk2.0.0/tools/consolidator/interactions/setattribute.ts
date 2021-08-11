import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner } from "../utils";
import { SetAttribute } from "../../../classes/setattribute";

export const setAttributeInteraction = async (
  remark: Remark,
  setAttributeEntity: SetAttribute,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on a non-existent NFT ${setAttributeEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on burned NFT ${setAttributeEntity.id}`
    );
  }

  const existingAttribute = nft.properties?.[setAttributeEntity.key];
  if (existingAttribute) {
    if (!existingAttribute._mutable) {
      throw new Error(
        `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on immutable attribute ${setAttributeEntity.key}`
      );
    }

    if (existingAttribute._mutable) {
      const rootowner = await findRealOwner(nft.owner, dbAdapter);

      if (rootowner !== remark.caller) {
        throw new Error(
          `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on a non-owned NFT. Expected ${remark.caller} but received ${rootowner}`
        );
      }
    }
  }

  if (!nft.properties) {
    nft.properties = {};
  }

  if (setAttributeEntity.attribute.value && setAttributeEntity.attribute.type) {
    nft.properties[setAttributeEntity.key] = {
      value: setAttributeEntity.attribute.value,
      type: setAttributeEntity.attribute.type,
    };
  }
  if (setAttributeEntity.freeze === "freeze") {
    nft.properties[setAttributeEntity.key]._mutable = false;
  }
};
