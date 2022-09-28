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

  for (let i = 0; i < nft.resources.length; i++) {
    if (nft.resources[i].id === resaddEntity.id) {
      throw new Error(
        `[${OP_TYPES.RESADD}] Attempting to add resource with already existing id ${resaddEntity.id} to NFT ${resaddEntity.nftId}`
      );
    }
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
    replace,
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
    replace
  };

  // Remove undefines
  Object.keys(resource).forEach((resKey) => {
    if (resource[resKey as keyof IResourceConsolidated] === undefined) {
      delete resource[resKey as keyof IResourceConsolidated];
    }
  });

  const existingResourceIndex = resaddEntity.replace
    ? nft.resources.findIndex((res) => res.id === resaddEntity.replace)
    : -1;
  // Replace existing resource
  if (existingResourceIndex > -1 && accepted && resaddEntity.replace) {
    nft.resources[existingResourceIndex] = {
      ...resource,
      id: resaddEntity.replace,
    };
  } else {
    nft.resources.push(resource);
  }

  // If this is the first resource being added and is immediatly accepted, set default priority array
  if (accepted) {
    if (!nft.priority.includes(resaddEntity.replace || resaddEntity.id)) {
      nft.priority.push(resaddEntity.replace || resaddEntity.id);
    }
  }
};
