import { NFT } from "../../classes/nft";
import { CollectionConsolidated, NFTConsolidated } from "./consolidator";
import { Collection } from "../../classes/collection";

export const consolidatedNFTtoInstance = (
  nft?: NFTConsolidated
): NFT | undefined => {
  if (!nft) {
    return undefined;
  }
  const {
    block,
    collection,
    name,
    instance,
    transferable,
    sn,
    metadata,
    id,
    data,
    ...rest
  } = nft || {};
  const nftClass = new NFT(
    block,
    collection,
    name,
    instance,
    transferable,
    sn,
    metadata,
    data
  );
  const { owner, forsale, reactions, changes, burned } = rest;
  nftClass.owner = owner;
  nftClass.forsale = forsale;
  nftClass.reactions = reactions;
  nftClass.changes = changes;
  nftClass.burned = burned;

  return nftClass;
};

export const consolidatedCollectionToInstance = (
  collection?: CollectionConsolidated
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }
  const { block, name, metadata, id, issuer, max, symbol, ...rest } =
    collection || {};
  const colleactionClass = new Collection(
    block,
    name,
    max,
    issuer,
    symbol,
    id,
    metadata
  );
  const { changes } = rest;

  colleactionClass.changes = changes;

  return colleactionClass;
};
