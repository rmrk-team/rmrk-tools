import { NftClass } from "../../../classes/nft-class";
import { OP_TYPES } from "../../constants";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { ChangeIssuer } from "../../../classes/changeissuer";

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
  nftClass?: NftClass // Collection in current state
) => {
  if (!nftClass) {
    throw new Error(
      `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such collection with ID ${changeIssuerEntity.id} found before block ${remark.block}!`
    );
  }

  if (remark.caller != nftClass.issuer) {
    throw new Error(
      `Attempting to change issuer of collection ${changeIssuerEntity.id} when not issuer!`
    );
  }

  nftClass.addChange({
    field: "issuer",
    old: nftClass.issuer,
    new: changeIssuerEntity.issuer,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.CHANGEISSUER,
  } as Change);

  nftClass.issuer = changeIssuerEntity.issuer;
};
