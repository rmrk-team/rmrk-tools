import { validateAccept } from "../tools/validate-remark";

export type AcceptEntityType = "NFT" | "RES";

export class Accept {
  readonly id: string;
  readonly nftId: string;
  readonly entity: AcceptEntityType;

  constructor(nftId: string, entity: AcceptEntityType, id: string) {
    this.id = id;
    this.nftId = nftId;
    this.entity = entity;
  }

  static fromRemark(remark: string): Accept | string {
    try {
      validateAccept(remark);
      const [_prefix, _op_type, _version, nftId, entity, id] = remark.split(
        "::"
      );
      return new this(nftId, entity as AcceptEntityType, id);
    } catch (e) {
      console.error(e.message);
      console.log(`ACCEPT error: fu ll input was ${remark}`);
      return e.message;
    }
  }
}
