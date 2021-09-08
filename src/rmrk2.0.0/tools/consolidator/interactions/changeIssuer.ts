import { Collection } from "../../../classes/collection";
import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { ChangeIssuer } from "../../../classes/changeissuer";
import { Base } from "../../../classes/base";

export const getChangeIssuerEntity = (remark: Remark): ChangeIssuer => {
  const changeIssuerEntity = ChangeIssuer.fromRemark(remark.remark);

  if (typeof changeIssuerEntity === "string") {
    throw new Error(
      `[${OP_TYPES.CHANGEISSUER}] Dead before instantiation: ${changeIssuerEntity}`
    );
  }
  return changeIssuerEntity;
};

export const changeIssuerInteraction = (
  remark: Remark,
  changeIssuerEntity: ChangeIssuer,
  entity?: Collection | Base
) => {
  const entityType = changeIssuerEntity.id.startsWith("base-")
    ? "base"
    : "collection";
  if (!entity) {
    throw new Error(
      `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such ${entityType} with ID ${changeIssuerEntity.id} found before block ${remark.block}!`
    );
  }

  if (remark.caller !== entity.issuer) {
    throw new Error(
      `Attempting to change issuer of ${entityType} ${changeIssuerEntity.id} when not issuer!`
    );
  }

  entity.addChange({
    field: "issuer",
    old: entity.issuer,
    new: changeIssuerEntity.issuer,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.CHANGEISSUER,
  } as Change);

  entity.issuer = changeIssuerEntity.issuer;
};
