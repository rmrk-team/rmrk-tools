import { validateResadd } from "../tools/validate-remark";
import { Resource } from "./nft";
import { getRemarkData } from "../../rmrk1.0.0/tools/utils";

export class Resadd {
  readonly base?: string;
  readonly media?: string;
  readonly metadata?: string;
  readonly slot?: string;
  id: string;
  pending: boolean;

  constructor(id: string, resource: Resource) {
    this.base = resource.base;
    this.media = resource.media;
    this.metadata = resource.metadata;
    this.slot = resource.slot;
    this.pending = resource.pending || true;
    this.id = id;
  }

  static fromRemark(remark: string): Resadd | string {
    try {
      validateResadd(remark);
      const [_prefix, _op_type, _version, id, resource] = remark.split("::");
      const resourceObj: Resource = getRemarkData(resource);
      return new this(id, resourceObj);
    } catch (e) {
      console.error(e.message);
      console.log(`RESADD error: full input was ${remark}`);
      return e.message;
    }
  }
}
