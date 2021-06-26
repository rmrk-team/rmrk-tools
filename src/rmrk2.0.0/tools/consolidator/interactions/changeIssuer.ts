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
  nftclass?: NftClass // Nftclass in current state
) => {
  if (!nftclass) {
    throw new Error(
      `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such nft class with ID ${changeIssuerEntity.id} found before block ${remark.block}!`
    );
  }

  if (remark.caller != nftclass.issuer) {
    throw new Error(
      `Attempting to change issuer of nft class ${changeIssuerEntity.id} when not issuer!`
    );
  }

  nftclass.addChange({
    field: "issuer",
    old: nftclass.issuer,
    new: changeIssuerEntity.issuer,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.CHANGEISSUER,
  } as Change);

  nftclass.issuer = changeIssuerEntity.issuer;
};
