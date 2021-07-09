import { Remark } from "../remark";
import { NFT } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { Accept } from "../../../classes/accept";
import { findRealOwner } from "../utils";

export const acceptInteraction = async (
  remark: Remark,
  acceptEntity: Accept,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.ACCEPT}] Attempting to accept entity on a non-existant NFT ${acceptEntity.nftId}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.ACCEPT}] Attempting to accept entity on burned NFT ${acceptEntity.nftId}`
    );
  }

  // If NFT owner is adding this resource then immediatly accept it
  const rootowner = await findRealOwner(nft.owner, dbAdapter);
  if (rootowner !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.ACCEPT}] Attempting to accept entrity on non-owned NFT ${acceptEntity.nftId}`
    );
  }

  if (acceptEntity.entity === "nft") {
    const pendingNft = await dbAdapter.getNftclassById(acceptEntity.id);
    if (!pendingNft) {
      throw new Error(
        `[${OP_TYPES.ACCEPT}] Attempting to accept non-existant child NFT ${acceptEntity.id}`
      );
    }

    if (nft.children?.[acceptEntity.id]?.pending) {
      nft.children[acceptEntity.id].pending = false;
    }
  } else if (acceptEntity.entity === "resource") {
    const resourceIndex = nft.resources.findIndex(
      (resource) => resource.id === acceptEntity.id
    );
    if (resourceIndex > -1 && nft.resources?.[resourceIndex]?.pending) {
      nft.resources[resourceIndex].pending = false;
      if (nft.resources.length === 1) {
        nft.priority = [0];
      }
    }
  }
};
