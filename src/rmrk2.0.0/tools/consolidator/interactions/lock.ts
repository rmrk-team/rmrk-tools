import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";
import { IConsolidatorAdapter } from "../adapters/types";
import { Collection } from "../../../classes/collection";
import { Lock } from "../../../classes/lock";

export const lockInteraction = async (
  remark: Remark,
  lockEntity: Lock,
  dbAdapter: IConsolidatorAdapter,
  collection?: Collection
): Promise<void> => {
  if (!collection) {
    throw new Error(
      `[${OP_TYPES.LOCK}] Attempting to lock a non-existent Collection ${lockEntity.id}`
    );
  }

  // TODO: add unit tests
  if (remark.caller !== collection.issuer) {
    throw new Error(
      `Attempting to lock collection ${lockEntity.id} when not issuer!`
    );
  }
};
