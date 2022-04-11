import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { Collection } from "../../../classes/collection";
import { Destroy } from "../../../classes/destroy";

export const destroyInteraction = async (
  remark: Remark,
  destroyEntity: Destroy,
  dbAdapter: IConsolidatorAdapter,
  collection?: Collection
): Promise<void> => {
  if (!collection) {
    throw new Error(
      `[${OP_TYPES.DESTROY}] Attempting to destroy a non-existent Collection ${destroyEntity.id}`
    );
  }

  if (remark.caller !== collection.issuer) {
    throw new Error(
      `Attempting to destroy collection ${destroyEntity.id} when not issuer!`
    );
  }

  const nfts = await dbAdapter.getNFTsByCollection(destroyEntity.id);
  const unburnedNfts = nfts ? nfts.filter((nft) => nft.burned === "") : [];

  if (unburnedNfts.length > 0) {
    throw new Error(
      `[${OP_TYPES.DESTROY}] Collection with unburned nfts cannot be destroyed ${destroyEntity.id}`
    );
  }
};
