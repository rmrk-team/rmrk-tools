import { validateResadd } from "../tools/validate-remark";
import { Resource } from "./nft";
import { getRemarkData } from "../../rmrk1.0.0/tools/utils";
import { nanoid } from "nanoid";

export class Resadd {
  readonly base?: string;
  readonly src?: string;
  readonly thumb?: string;
  readonly metadata?: string;
  readonly slot?: string;
  readonly parts?: string[];
  id: string;
  nftId: string;
  pending: boolean;

  constructor(nftId: string, resource: Resource) {
    this.base = resource.base;
    this.src = resource.src;
    this.thumb = resource.thumb;
    this.metadata = resource.metadata;
    this.slot = resource.slot;
    this.parts = resource.parts;
    this.pending = resource.pending || true;
    this.nftId = nftId;
    this.id = resource.id || nanoid(8);
  }

  static fromRemark(remark: string): Resadd | string {
    try {
      validateResadd(remark);
      const [_prefix, _op_type, _version, nftId, resource] = remark.split("::");
      const resourceObj: Resource = getRemarkData(resource);
      return new this(nftId, resourceObj);
    } catch (e) {
      console.error(e.message);
      console.log(`RESADD error: full input was ${remark}`);
      return e.message;
    }
  }
}
