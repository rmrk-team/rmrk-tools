import { Collection } from "../../..";
import { OP_TYPES } from "../../constants";
import { Change } from "../../../rmrk1.0.0/changelog";
import { Remark } from "../remark";
import { ChangeIssuer } from "../../../rmrk1.0.0/classes/changeissuer";

export const changeIssuerInteraction = (
  remark: Remark,
  changeIssuerEntity: ChangeIssuer,
  collection?: Collection // Collection in current state
) => {
  if (!collection) {
    throw new Error(
      `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such collection with ID ${changeIssuerEntity.id} found before block ${remark.block}!`
    );
  }

  if (remark.caller != collection.issuer) {
    throw new Error(
      `Attempting to change issuer of collection ${changeIssuerEntity.id} when not issuer!`
    );
  }

  collection.addChange({
    field: "issuer",
    old: collection.issuer,
    new: changeIssuerEntity.issuer,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.CHANGEISSUER,
  } as Change);

  collection.issuer = changeIssuerEntity.issuer;
};
