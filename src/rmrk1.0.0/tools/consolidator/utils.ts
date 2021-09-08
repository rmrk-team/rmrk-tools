import { NFT } from "../../classes/nft";
import { CollectionConsolidated, NFTConsolidated } from "./consolidator";
import {
  Collection as C100,
  Collection,
} from "../../rmrk1.0.0/classes/collection";
import { Remark } from "./remark";
import { ChangeIssuer } from "../../rmrk1.0.0/classes/changeissuer";
import { OP_TYPES } from "../constants";

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
    updatedAtBlock,
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
    data,
    updatedAtBlock
  );
  const { owner, forsale, reactions, changes, loadedMetadata, burned } = rest;
  nftClass.owner = owner;
  nftClass.forsale = forsale;
  nftClass.reactions = reactions;
  nftClass.changes = changes;
  nftClass.loadedMetadata = loadedMetadata;
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
  const { changes, loadedMetadata } = rest;

  colleactionClass.changes = changes;
  colleactionClass.loadedMetadata = loadedMetadata;

  return colleactionClass;
};
export const getChangeIssuerEntity = (remark: Remark): ChangeIssuer => {
  const changeIssuerEntity = ChangeIssuer.fromRemark(remark.remark);

  if (typeof changeIssuerEntity === "string") {
    throw new Error(
      `[${OP_TYPES.CHANGEISSUER}] Dead before instantiation: ${changeIssuerEntity}`
    );
  }
  return changeIssuerEntity;
};
export const getCollectionFromRemark = (remark: Remark) => {
  const collection = C100.fromRemark(remark.remark, remark.block);
  if (typeof collection === "string") {
    throw new Error(
      `[${OP_TYPES.MINT}] Dead before instantiation: ${collection}`
    );
  }
  return collection;
};
