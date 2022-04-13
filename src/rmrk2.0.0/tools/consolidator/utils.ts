import { NFT } from "../../classes/nft";
import {
  BaseConsolidated,
  CollectionConsolidated,
  NFTConsolidated,
} from "./consolidator";
import { Collection } from "../../classes/collection";
import { IConsolidatorAdapter } from "./adapters/types";
import { Base } from "../../classes/base";
import { List } from "../../classes/list";
import { changeIssuerInteraction } from "./interactions/changeIssuer";
import { ChangeIssuer } from "../../classes/changeissuer";
import { Remark } from "./remark";
import { OP_TYPES } from "../constants";

export const isNftTransferable = (nft: NFT, remark: Remark, opType: OP_TYPES) => {
  //check transferability if not buy or delist interactions
  if (opType === "LIST" && List.fromRemark(remark.remark).price !== 0 || opType !== "BUY") {
    return (
      nft.transferable === 1 ||
      (nft.transferable < 0 && nft.block - nft.transferable >= remark.block) ||
      (nft.transferable > 1 && remark.block >= nft.transferable)
    );
  //if set to be transferable for x blocks always allow delist and buy
  } else if (nft.transferable < 0) {
    return true;
  //else check whether buy and delist are allowed
  } else {
    return (
      nft.transferable === 1 ||
      (nft.transferable > 1 && remark.block >= nft.transferable)
    );
  }
};

export const validateTransferability = (
  nft: NFT,
  remark: Remark,
  opType: OP_TYPES
) => {
  if (!isNftTransferable(nft, remark, opType)) {
    let errorMessage = `[${opType}] Attempting to ${opType} non-transferable NFT ${nft.getId()}.`;
    if (nft.transferable > 1) {
      errorMessage = `[${opType}] Attempting to ${opType} non-transferable NFT ${nft.getId()}. It will become transferable after block ${
        nft.transferable
      } but tx made at block ${remark.block}`;
    }

    if (nft.transferable < 0) {
      errorMessage = `[${opType}] Attempting to ${opType} non-transferable NFT ${nft.getId()}. It was transferable until block ${
        nft.block - nft.transferable
      } but tx made at block ${remark.block}`;
    }

    throw new Error(errorMessage);
  }

  return true;
};

export const validateMinBlockBetweenEvents = (
  opType: OP_TYPES,
  nft: NFTConsolidated,
  remark: Remark
) => {
  const lastChange = nft.changes
    .filter((change) => change.opType === opType)
    .sort((change, prevChange) => prevChange.block - change.block)?.[0];

  if (!lastChange?.block) {
    return true;
  }

  if (remark.block - lastChange.block < 5) {
    throw new Error(
      `[${opType}] There should be minimum of 5 blocks between last ${opType} interaction: ${remark.remark}`
    );
  }
};

/**
 * Validate polkadot address
 * @param address
 */
export const isValidAddressPolkadotAddress = (address: string) => {
  return address && !address.includes("-");
};

export const findRealOwner = async (
  nftId: string,
  dbAdapter: IConsolidatorAdapter,
  level = 1
): Promise<string> => {
  if (level > 10) {
    throw new Error(
      "Trying to find an owner too deep, possible stack overflow"
    );
  }
  if (isValidAddressPolkadotAddress(nftId)) {
    return nftId;
  } else {
    const consolidatedNFT = await dbAdapter.getNFTByIdUnique(nftId);

    if (!consolidatedNFT) {
      // skip
      return "";
    }

    // Bubble up until owner of nft is polkadot address
    return await findRealOwner(consolidatedNFT.owner, dbAdapter, level + 1);
  }
};

export const invalidateIfRecursion = async (
  nftId: string,
  recepientId: string,
  dbAdapter: IConsolidatorAdapter
): Promise<boolean> => {
  if (isValidAddressPolkadotAddress(recepientId)) {
    return true;
  } else {
    const consolidatedNFT = await dbAdapter.getNFTByIdUnique(recepientId);

    if (!consolidatedNFT) {
      // skip
      return true;
    }

    // const hasRecursiveChild = nft.children.find(child => child.id === initialNftId);
    if (consolidatedNFT.id === nftId) {
      throw new Error("Cannot have an nft that is it's own child");
    }

    // Bubble up until owner of nft is polkadot address
    return await invalidateIfRecursion(nftId, consolidatedNFT.owner, dbAdapter);
  }
};

export const consolidatedNFTtoInstance = (
  nft?: NFTConsolidated
): NFT | undefined => {
  if (!nft) {
    return undefined;
  }
  const {
    block,
    collection,
    symbol,
    transferable,
    sn,
    metadata,
    id,
    properties,
    ...rest
  } = nft || {};
  const nftInstance = new NFT({
    block,
    collection,
    symbol,
    transferable,
    sn,
    metadata,
    properties,
  });
  const {
    owner,
    rootowner,
    forsale,
    reactions,
    changes,
    burned,
    children,
    resources,
    priority,
  } = rest;
  nftInstance.owner = owner;
  nftInstance.rootowner = rootowner;
  nftInstance.forsale = forsale;
  nftInstance.reactions = reactions;
  nftInstance.changes = changes;
  nftInstance.burned = burned;
  nftInstance.children = children;
  nftInstance.resources = resources;
  nftInstance.priority = priority;

  return nftInstance;
};

export const consolidatedCollectionToInstance = (
  collection?: CollectionConsolidated
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }
  const { block, metadata, id, issuer, max, symbol, ...rest } =
    collection || {};
  const collectionInstance = new Collection(
    block,
    max,
    issuer,
    symbol,
    id,
    metadata
  );
  const { changes } = rest;

  collectionInstance.changes = changes;
  return collectionInstance;
};

export const consolidatedBasetoInstance = (
  base?: BaseConsolidated
): Base | undefined => {
  if (!base) {
    return undefined;
  }
  const { block, id, issuer, type, parts, symbol, themes } = base || {};
  const baseInstance = new Base(block, symbol, issuer, type, parts, themes);

  return baseInstance;
};

export const doesRecipientExists = async (
  recipient: string,
  dbAdapter: IConsolidatorAdapter
): Promise<boolean> => {
  try {
    if (isValidAddressPolkadotAddress(recipient)) {
      return true;
    } else {
      const consolidatedNFT = await dbAdapter.getNFTByIdUnique(recipient);
      return Boolean(consolidatedNFT);
    }
  } catch (error: any) {
    return false;
  }
};

export const changeIssuerCollection = async (
  changeIssuerEntity: ChangeIssuer,
  remark: Remark,
  onSuccess: (id: string) => void,
  dbAdapter: IConsolidatorAdapter
) => {
  const consolidatedCollection = await dbAdapter.getCollectionById(
    changeIssuerEntity.id
  );
  const collection = consolidatedCollectionToInstance(consolidatedCollection);

  changeIssuerInteraction(remark, changeIssuerEntity, collection);
  if (collection && consolidatedCollection) {
    await dbAdapter.updateCollectionIssuer(collection, consolidatedCollection);
    if (onSuccess) {
      onSuccess(collection.id);
    }
  }
};

export const changeIssuerBase = async (
  changeIssuerEntity: ChangeIssuer,
  remark: Remark,
  onSuccess: (id: string) => void,
  dbAdapter: IConsolidatorAdapter
) => {
  const consolidatedBase = await dbAdapter.getBaseById(changeIssuerEntity.id);
  const base = consolidatedBasetoInstance(consolidatedBase);

  changeIssuerInteraction(remark, changeIssuerEntity, base);
  if (base && consolidatedBase) {
    await dbAdapter.updateBaseIssuer(base, consolidatedBase);
    if (onSuccess) {
      onSuccess(base.getId());
    }
  }
};
