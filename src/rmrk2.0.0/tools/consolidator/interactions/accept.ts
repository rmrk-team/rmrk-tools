import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { Accept } from "../../../classes/accept";
import { findRealOwner } from "../utils";

interface ReturnObject {
  RESOURCES: string[];
  CHILDREN: string[];
}

export const acceptInteraction = async (
  remark: Remark,
  acceptEntity: Accept,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<ReturnObject> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.ACCEPT}] Attempting to accept ${acceptEntity.entity} on a non-existant NFT ${acceptEntity.nftId}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.ACCEPT}] Attempting to accept ${acceptEntity.entity} on burned NFT ${acceptEntity.nftId}`
    );
  }

  // If NFT owner is adding this resource then immediatly accept it
  const rootowner =
    nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));
  if (rootowner !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.ACCEPT}] Attempting to accept ${acceptEntity.entity} on non-owned NFT ${acceptEntity.nftId}`
    );
  }

  const returnObject: ReturnObject = {
    RESOURCES: [],
    CHILDREN: [],
  };

  if (acceptEntity.entity === "NFT") {
    const pendingNft = await dbAdapter.getNFTById(acceptEntity.id);
    if (!pendingNft) {
      throw new Error(
        `[${OP_TYPES.ACCEPT}] Attempting to accept non-existant child NFT ${acceptEntity.id}`
      );
    }

    const childIndex = nft.children.findIndex(
      (child) => child.id === acceptEntity.id
    );
    if (childIndex > -1) {
      nft.children[childIndex].pending = false;
      returnObject.CHILDREN.push(acceptEntity.id);
    }

    const childNft = await dbAdapter.getNFTById(acceptEntity.id);
    if (childNft) {
      childNft.pending = false;
    }
  } else if (acceptEntity.entity === "RES") {
    const resourceIndex = nft.resources.findIndex(
      (resource) => resource.id === acceptEntity.id
    );
    if (resourceIndex > -1 && nft.resources?.[resourceIndex]?.pending) {
      nft.resources[resourceIndex].pending = false;
      returnObject.RESOURCES.push(acceptEntity.id);
      const { replace, ...resource } = nft.resources[resourceIndex];

      if (!nft.priority.includes(replace || acceptEntity.id)) {
        nft.priority.push(replace || acceptEntity.id);
      }

      const existingResourceIndex = replace
        ? nft.resources.findIndex((res) => res.id === replace)
        : -1;
      // Replace existing resource
      if (existingResourceIndex > -1 && replace) {
        nft.resources[existingResourceIndex] = { ...resource, id: replace };
        nft.resources.splice(resourceIndex, 1);
        returnObject.RESOURCES.push(replace);
      }
    }
  }

  return returnObject;
};
