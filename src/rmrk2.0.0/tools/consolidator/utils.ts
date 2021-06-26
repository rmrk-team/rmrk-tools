import { NFT } from "../../classes/nft";
import { CollectionConsolidated, NFTConsolidated } from "./consolidator";
import { NftClass } from "../../classes/nft-class";

export const consolidatedNFTtoInstance = (
  nft?: NFTConsolidated
): NFT | undefined => {
  if (!nft) {
    return undefined;
  }
  const {
    block,
    nftclass,
    name,
    instance,
    transferable,
    sn,
    metadata,
    id,
    resources,
    priority,
    ...rest
  } = nft || {};
  const nftInstance = new NFT({
    block,
    nftclass,
    name,
    instance,
    transferable,
    sn,
    metadata,
    resources,
    priority,
  });
  const { owner, forsale, reactions, changes, burned, children } = rest;
  nftInstance.owner = owner;
  nftInstance.forsale = forsale;
  nftInstance.reactions = reactions;
  nftInstance.changes = changes;
  nftInstance.burned = burned;
  nftInstance.children = children;

  return nftInstance;
};

export const consolidatedCollectionToInstance = (
  nftclass?: CollectionConsolidated
): NftClass | undefined => {
  if (!nftclass) {
    return undefined;
  }
  const { block, name, metadata, id, issuer, max, symbol, ...rest } =
    nftclass || {};
  const nftclassInstance = new NftClass(
    block,
    name,
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
