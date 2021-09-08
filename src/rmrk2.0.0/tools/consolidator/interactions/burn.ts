import { OP_TYPES, PREFIX } from "../../constants";
import { BlockCall } from "../../types";
import { Change } from "../../../changelog";
import { Remark } from "../remark";
import { Burn } from "../../../classes/burn";
import { NFT } from "../../../classes/nft";
import { hexToString } from "@polkadot/util";
import { isValidAddressPolkadotAddress } from "../utils";
import { IConsolidatorAdapter } from "../adapters/types";

export const burnInteraction = async (
  remark: Remark,
  burnEntity: Burn,
  dbAdapter: IConsolidatorAdapter,
  nft?: NFT
): Promise<void> => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.BURN}] Attempting to BURN non-existant NFT ${burnEntity.id}`
    );
  }

  if (Boolean(nft.burned)) {
    throw new Error(
      `[${OP_TYPES.BURN}] Attempting to burn already burned NFT ${burnEntity.id}`
    );
  }

  // Check if burner is owner of NFT
  if (nft.owner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.BURN}] Attempting to BURN non-owned NFT ${burnEntity.id}`
    );
  }

  if (!isValidAddressPolkadotAddress(nft.owner)) {
    //Owner is nft, remove current nft from owner's children
    const owner = await dbAdapter.getNFTById(nft.owner);
    const childIndex =
      (owner &&
        owner.children.findIndex((child) => child.id === nft.getId())) ||
      -1;
    if (owner && childIndex > -1) {
      owner.children.splice(childIndex, 1);
    }
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

  const burnReason = burnReasons.length < 1 ? "true" : burnReasons.join("~~~");
  nft.addChange({
    field: "burned",
    old: "",
    new: burnReason,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.BURN,
  } as Change);
  nft.burned = burnReason;

  // De list if listed for sale
  nft.addChange({
    field: "forsale",
    old: nft.forsale,
    new: BigInt(0),
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.BURN,
  } as Change);
  nft.forsale = BigInt(0);
};
