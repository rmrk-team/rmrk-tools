import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner } from "../utils";
import { Setproperty } from "../../../classes/setproperty";
import {validateRemarkBase, validateRoyaltiesPropertyValue} from "../../validate-remark";
import { hexToString } from "@polkadot/util";
import { Collection } from "../../../classes/collection";

export const setPropertyInteraction = async (
  remark: Remark,
  setPropertyEntity: Setproperty,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT,
  collection?: Collection
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.SETPROPERTY}] Attempting to set property on a non-existent NFT ${setPropertyEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.SETPROPERTY}] Attempting to set property on burned NFT ${setPropertyEntity.id}`
    );
  }

  const existingProperty = nft.properties?.[setPropertyEntity.key];
  if (existingProperty) {
    if (!existingProperty?._mutation?.allowed && existingProperty.type !== "royalty") {
      throw new Error(
        `[${OP_TYPES.SETPROPERTY}] Attempting to set property on immutable property ${setPropertyEntity.key}`
      );
    }

    if (existingProperty?._mutation?.allowed) {
      const rootowner =
        nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));

      if (rootowner !== remark.caller) {
        throw new Error(
          `[${OP_TYPES.SETPROPERTY}] Attempting to set property on a non-owned NFT. Expected ${remark.caller} but received ${rootowner}`
        );
      }

      if (
        existingProperty.type === "royalty" &&
        nft.rootowner !== collection?.issuer
      ) {
        throw new Error(
          `[${OP_TYPES.SETPROPERTY}] Only issuer can mutate an attribute of type 'royalty'.`
        );
      }

      if (existingProperty._mutation.with?.opType) {
        if (!remark.extra_ex || remark.extra_ex.length < 1) {
          throw new Error(
            `[${OP_TYPES.SETPROPERTY}] Attempting to mutate property without matching extra call of op type ${existingProperty._mutation.with.opType}`
          );
        }
        const matchingExtraCall = remark.extra_ex.find(
          (extraCall) =>
            extraCall.call === "system.remark" &&
            hexToString(extraCall.value).includes(
              existingProperty._mutation?.with?.opType as string
            )
        );

        if (!matchingExtraCall) {
          throw new Error(
            `[${OP_TYPES.SETPROPERTY}] Attempting to mutate property without matching extra call of op type ${existingProperty._mutation.with.opType}`
          );
        }

        const extraCallRemarkString = hexToString(matchingExtraCall.value);
        validateRemarkBase(
          extraCallRemarkString,
          existingProperty._mutation.with.opType
        );

        if (existingProperty._mutation.with.condition) {
          let valid = false;
          if (existingProperty._mutation.with.opType === OP_TYPES.BURN) {
            const regex = new RegExp(
              `::\\d+-${existingProperty._mutation.with.condition}`,
              "g"
            );
            valid = regex.test(extraCallRemarkString);
          } else {
            valid = extraCallRemarkString.includes(
              existingProperty._mutation.with.condition
            );
          }

          if (!valid) {
            throw new Error(
              `[${OP_TYPES.SETPROPERTY}] Attempting to mutate an property but it's mutation condition doesn't match`
            );
          }
        }
      }
    }
  }

  if (!nft.properties) {
    nft.properties = {};
  }

  if (nft.properties) {
    validateRoyaltiesPropertyValue(nft.properties);
  }

  if (
    typeof nft.properties[setPropertyEntity.key].value ===
    typeof setPropertyEntity.property
  ) {
    nft.properties[setPropertyEntity.key].value = setPropertyEntity.property;
  } else {
    throw new Error(
      `[${
        OP_TYPES.SETPROPERTY
      }] Attempting to mutate a property but types don't match, previous type was ${typeof nft
        .properties[setPropertyEntity.key].value}`
    );
  }

  if (
    setPropertyEntity.freeze &&
    nft.properties[setPropertyEntity.key]?._mutation?.allowed === true
  ) {
    nft.properties[setPropertyEntity.key]._mutation!.allowed = false;
  }
};
