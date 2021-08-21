import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner } from "../utils";
import { SetAttribute } from "../../../classes/setattribute";
import { validateRemarkBase } from "../../validate-remark";
import { hexToString } from "@polkadot/util";

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
    if (!existingAttribute?._mutation?.allowed) {
      throw new Error(
        `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on immutable attribute ${setAttributeEntity.key}`
      );
    }

    if (existingAttribute?._mutation?.allowed) {
      const rootowner = await findRealOwner(nft.owner, dbAdapter);

      if (rootowner !== remark.caller) {
        throw new Error(
          `[${OP_TYPES.SETATTRIBUTE}] Attempting to set attribute on a non-owned NFT. Expected ${remark.caller} but received ${rootowner}`
        );
      }

      if (existingAttribute._mutation.with?.opType) {
        if (!remark.extra_ex || remark.extra_ex.length < 1) {
          throw new Error(
            `[${OP_TYPES.SETATTRIBUTE}] Attempting to mutate attribute without matching extra call of op type ${existingAttribute._mutation.with.opType}`
          );
        }
        const matchingExtraCall = remark.extra_ex.find(
          (extraCall) =>
            extraCall.call === "system.remark" &&
            hexToString(extraCall.value).includes(
              existingAttribute._mutation?.with?.opType as string
            )
        );

        if (!matchingExtraCall) {
          throw new Error(
            `[${OP_TYPES.SETATTRIBUTE}] Attempting to mutate attribute without matching extra call of op type ${existingAttribute._mutation.with.opType}`
          );
        }

        const extraCallRemarkString = hexToString(matchingExtraCall.value);
        validateRemarkBase(
          extraCallRemarkString,
          existingAttribute._mutation.with.opType
        );

        if (existingAttribute._mutation.with.condition) {
          let valid = false;
          if (existingAttribute._mutation.with.opType === OP_TYPES.BURN) {
            const regex = new RegExp(
              `::\\d+-${existingAttribute._mutation.with.condition}`,
              "g"
            );
            valid = regex.test(extraCallRemarkString);
          } else {
            valid = extraCallRemarkString.includes(
              existingAttribute._mutation.with.condition
            );
          }

          if (!valid) {
            throw new Error(
              `[${OP_TYPES.SETATTRIBUTE}] Attempting to mutate an attribute but it's mutation condition doesn't match`
            );
          }
        }
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
};
