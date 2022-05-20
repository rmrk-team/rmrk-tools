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

  static fromRemark(remark: string): Resadd | string {
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
      return new this(nftId, resourceObj, replaceId);
    } catch (e: any) {
      console.error(e.message);
      console.log(`RESADD error: full input was ${remark}`);
      return e.message;
    }
  }
}
