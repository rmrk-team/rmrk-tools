import { Remark } from "../remark";
import { IResourceConsolidated, NFT, Resource } from "../../../classes/nft";
import { OP_TYPES } from "../../constants";
import { Resadd } from "../../../classes/resadd";
import { findRealOwner } from "../utils";
import { IConsolidatorAdapter } from "../adapters/types";

export const resAddInteraction = async (
  remark: Remark,
  resaddEntity: Resadd,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.RESADD}] Attempting to add resource on a non-existant NFT ${resaddEntity.nftId}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.RESADD}] Attempting to add resource on burned NFT ${resaddEntity.nftId}`
    );
  }

  const nftCollection = await dbAdapter.getCollectionById(nft.collection);
  if (!nftCollection || nftCollection.issuer !== remark.caller) {
    throw new Error(
      `[${OP_TYPES.RESADD}] Attempting to add resource to NFT in non-owned collection ${nft.collection}`
    );
  }

  // If NFT owner is adding this resource then immediatly accept it
  const rootowner =
    nft.rootowner || (await findRealOwner(nft.owner, dbAdapter));

  const accepted = rootowner === remark.caller;
  resaddEntity.pending = !accepted;
  const {
    pending,
    id,
    metadata,
    base,
    src,
    slot,
    parts,
    thumb,
    themeId,
    theme,
  } = resaddEntity;

  const resource: IResourceConsolidated = {
    pending,
    id,
    metadata,
    base,
    src,
    slot,
    parts,
    thumb,
    themeId,
    theme,
  };

  // Remove undefines
  Object.keys(resource).forEach((resKey) => {
    if (resource[resKey as keyof IResourceConsolidated] === undefined) {
      delete resource[resKey as keyof IResourceConsolidated];
    }
  });

  const existingResourceIndex = nft.resources.findIndex(
    (res) => res.id === resource.id
  );
  // Replace existing resource
  if (existingResourceIndex > -1) {
    nft.resources[existingResourceIndex] = resource;
  } else {
    nft.resources.push(resource);
  }

  // If this is the first resource being added and is immediatly accepted, set default priority array
  if (accepted) {
    if (!nft.priority.includes(resaddEntity.id)) {
      nft.priority.push(resaddEntity.id);
    }
  }
};
