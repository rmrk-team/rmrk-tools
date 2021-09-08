import { OP_TYPES, PREFIX } from "../../constants";
import { BlockCall } from "../../types";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { Consume } from "../../../classes/consume";
import { NFT } from "../../../index";
import { hexToString } from "@polkadot/util";

export const consumeInteraction = (
  remark: Remark,
  consumeEntity: Consume,
  nft?: NFT
): void => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.CONSUME}] Attempting to CONSUME non-existant NFT ${consumeEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.CONSUME}] Attempting to burn already burned NFT ${consumeEntity.id}`
    );
  }

  // Check if burner is owner of NFT
  if (nft.owner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.CONSUME}] Attempting to CONSUME non-owned NFT ${consumeEntity.id}`
    );
  }

  // Burn and note reason

  const burnReasons: string[] = [];
  // Check if we have extra calls in the batch
  if (remark.extra_ex?.length) {
    // Check if the transfer is valid, i.e. matches target recipient and value.
    remark.extra_ex?.forEach((el: BlockCall) => {
      const str = hexToString(el.value);
      // Grab a reason in same batchAll array that is not another remark
      if (!str.toUpperCase().startsWith(PREFIX)) {
        burnReasons.push(el.value);
      }
    });
  }

  // const [prefix, op_type, version] = remark.split("::");

  nft.updatedAtBlock = remark.block;
  const burnReason = burnReasons.length < 1 ? "true" : burnReasons.join("~~~");
  nft.addChange({
    field: "burned",
    old: "",
    new: burnReason,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.CONSUME,
  } as Change);
  nft.burned = burnReason;

  // De list if listed for sale
  nft.addChange({
    field: "forsale",
    old: nft.forsale,
    new: BigInt(0),
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.CONSUME,
  } as Change);
  nft.forsale = BigInt(0);
};
