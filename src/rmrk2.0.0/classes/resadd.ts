import { validateResadd } from "../tools/validate-remark";
import { Resource } from "./nft";
import { getRemarkData } from "../tools/utils";
import { nanoid } from "nanoid";
import { Theme } from "./base";

export class Resadd {
  readonly base?: string;
  readonly src?: string;
  readonly thumb?: string;
  readonly metadata?: string;
  readonly slot?: string;
  readonly parts?: string[];
  readonly theme?: Theme;
  readonly themeId?: string;
  id: string;
  nftId: string;
  pending: boolean;
  replace?: string;

  constructor(nftId: string, resource: Resource, replaceId?: string) {
    this.base = resource.base;
    this.src = resource.src;
    this.thumb = resource.thumb;
    this.metadata = resource.metadata;
    this.slot = resource.slot;
    this.parts = resource.parts;
    this.theme = resource.theme;
    this.themeId = resource.themeId;
    this.pending = resource.pending || true;
    this.nftId = nftId;
    this.id = resource.id || nanoid(8);
    this.replace = replaceId;
  }

  static fromRemark(
    remark: string,
    block?: number
  ): Resadd | string {
    if (!block) {
      block = 0;
    }
    try {
      validateResadd(remark);
      const [
        _prefix,
        _op_type,
        _version,
        nftId,
        resource,
        replaceId,
      ] = remark.split("::");
      const resourceObj: Resource = getRemarkData(resource);
      let the_nftId = nftId;
      const splitNftId = String(nftId).split("-");
      if (splitNftId[0] === 0 && remark.block) {
        splitNftId[0] = remark.block;
        the_nftId = splitNftId.join("-");
      }
      return new this(the_nftId, resourceObj, replaceId);
    } catch (e: any) {
      console.error(e.message);
      console.log(`RESADD error: full input was ${remark}`);
      return e.message;
    }
  }
}
