import { NFT } from "../../classes/nft";
import {
  BaseConsolidated,
  NftclassConsolidated,
  NFTConsolidated,
} from "./consolidator";
import { NftClass } from "../../classes/nft-class";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { hexToU8a, isHex } from "@polkadot/util";
import { IConsolidatorAdapter } from "./adapters/types";
import { Base } from "../../classes/base";

/**
 * Validate polkadot address
 * @param address
 */
export const isValidAddressPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (error) {
    return false;
  }
};

export const findRealOwner = async (
  nftId: string,
  dbAdapter: IConsolidatorAdapter
): Promise<string> => {
  const consolidatedNFT = await dbAdapter.getNFTByIdUnique(nftId);
  const nft = consolidatedNFTtoInstance(consolidatedNFT);
  if (!nft) {
    throw new Error(`Cannot find NFT with id ${nftId}`);
  }
  if (isValidAddressPolkadotAddress(nft.owner)) {
    return nft.owner;
  } else {
    // Bubble up until owner of nft is polkadot address
    return await findRealOwner(nft.owner, dbAdapter);
  }
};

export const consolidatedNFTtoInstance = (
  nft?: NFTConsolidated
): NFT | undefined => {
  if (!nft) {
    return undefined;
  }
  const { block, nftclass, symbol, transferable, sn, metadata, id, ...rest } =
    nft || {};
  const nftInstance = new NFT({
    block,
    nftclass,
    symbol,
    transferable,
    sn,
    metadata,
  });
  const {
    owner,
    forsale,
    reactions,
    changes,
    burned,
    children,
    resources,
    priority,
  } = rest;
  nftInstance.owner = owner;
  nftInstance.forsale = forsale;
  nftInstance.reactions = reactions;
  nftInstance.changes = changes;
  nftInstance.burned = burned;
  nftInstance.children = children;
  nftInstance.resources = resources;
  nftInstance.priority = priority;

  return nftInstance;
};

export const consolidatedNftclassToInstance = (
  nftclass?: NftclassConsolidated
): NftClass | undefined => {
  if (!nftclass) {
    return undefined;
  }
  const { block, metadata, id, issuer, max, symbol, ...rest } = nftclass || {};
  const nftclassInstance = new NftClass(
    block,
    max,
    issuer,
    symbol,
    id,
    metadata
  );
  const { changes } = rest;

  nftclassInstance.changes = changes;
  return nftclassInstance;
};

export const consolidatedBasetoInstance = (
  base?: BaseConsolidated
): Base | undefined => {
  if (!base) {
    return undefined;
  }
  const { block, id, issuer, type, ...rest } = base || {};
  const baseInstance = new Base(block, id, issuer, type);
  const { parts } = rest;
  baseInstance.parts = parts;

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
  } catch (error) {
    return false;
  }
};
