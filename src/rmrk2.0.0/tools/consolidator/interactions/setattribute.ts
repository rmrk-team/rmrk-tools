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

  const existingAttribute = nft.properties[setAttributeEntity.key];
  if (existingAttribute) {
    if (!existingAttribute._mutator || existingAttribute._mutator !== "issuer" && existingAttribute._mutator !== "owner") {
      throw new Error(
        `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on immutable attribute ${setAttributeEntity.key}`
      );
    }

    if (existingAttribute._mutator === "issuer") {
      const nftCollection = await dbAdapter.getCollectionById(nft.collection);

      if (!nftCollection || nftCollection.issuer !== remark.caller) {
        throw new Error(
          `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on and NFT where issuer is _mutator don't match. Expected ${remark.caller} but received ${nftCollection?.issuer}`
        );
      }
    }

    if (existingAttribute._mutator === "owner") {
      const rootowner = await findRealOwner(nft.owner, dbAdapter);

      if (rootowner !== remark.caller) {
        throw new Error(
          `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on and NFT where rootowner is _mutator don't match. Expected ${remark.caller} but received ${rootowner}`
        );
      }
    }
  }

  if (setAttributeEntity.attribute.value && setAttributeEntity.attribute.type) {
    nft.properties[setAttributeEntity.key] = {
      value: setAttributeEntity.attribute.value,
      type: setAttributeEntity.attribute.type,
    };
  }
  if (setAttributeEntity.freeze === "freeze") {
    delete nft.properties[setAttributeEntity.key]._mutator;
  }
};
