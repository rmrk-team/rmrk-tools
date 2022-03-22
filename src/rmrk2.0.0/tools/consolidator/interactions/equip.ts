import { Remark } from "../remark";
import { NFT, Resource } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { findRealOwner, isValidAddressPolkadotAddress } from "../utils";
import { Equip } from "../../../classes/equip";
import { NFTConsolidated } from "../consolidator";

export const equipInteraction = async (
  remark: Remark,
  equipEntity: Equip,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFTConsolidated,
  parentNft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip a non-existant NFT ${equipEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip burned NFT ${equipEntity.id}`
    );
  }

  if (isValidAddressPolkadotAddress(nft.owner)) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip NFT ${equipEntity.id} who's owner is account ${nft.owner}. You can only EQUIP on parent NFT`
    );
  }

  if (!parentNft) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip NFT ${equipEntity.id} on a non-existent parent NFT ${nft.owner}`
    );
  }

  // If NFT owner is adding this resource then immediatly accept it
  const rootowner =
    nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));
  if (rootowner !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Attempting to equip on non-owned NFT ${equipEntity.id}`
    );
  }

  if (
    parentNft.children.find((child) => child.id === equipEntity.id)?.pending
  ) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it wasn't accepted by a parent yet`
    );
  }

  const child = parentNft.children.find((child) => child.id === nft.id);

  if (!child) {
    throw new Error(
      `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it's parent is missing children array`
    );
  }

  if (equipEntity.baseslot === "") {
    child.equipped = "";
  }

  if (equipEntity.baseslot) {
    const [base, slot] = equipEntity.baseslot.split(".");

    const nftHasSlotResource = nft.resources.find(
      (resouce) => resouce.slot === equipEntity.baseslot
    );

    if (!nftHasSlotResource) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it has no compatible resource ${equipEntity.baseslot}`
      );
    }

    const baseEntity = await dbAdapter.getBaseById(base);
    const basepart = (baseEntity?.parts || []).find(
      (part) => part.id === slot && part.type === "slot"
    );
    if (!basepart) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it's base ${base} is missing a slot ${slot}`
      );
    }

    if (
      !basepart.equippable?.includes(nft.collection) &&
      !basepart.equippable?.includes("*")
    ) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because it's base ${base} slot ${slot} doesn't allow it's collection ${nft.collection}`
      );
    }

    /* If an NFT has multiple resources for the same baseslot then pick the one with highest priority index */
    const baseResource = parentNft.resources.find(
      (resource) => resource.base === base
    );

    if (!baseResource) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because parent's base with id ${base} is missing`
      );
    }

    if (baseResource.pending) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because parent's base is pending`
      );
    }

    const occupiedSlotChild = parentNft.children.find(
      (child) => child.equipped === equipEntity.baseslot
    );
    if (Boolean(occupiedSlotChild)) {
      throw new Error(
        `[${OP_TYPES.EQUIP}] Cannot equip NFT ${equipEntity.id} because the slot "${equipEntity.baseslot}" is already occupied by NFT "${occupiedSlotChild?.id}"`
      );
    }

    child.equipped = equipEntity.baseslot;
  }
};
