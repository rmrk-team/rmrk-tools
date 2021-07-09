import { validateAccept } from "../tools/validate-remark";

export class Accept {
  readonly id: string;
  readonly nftId: string;
  readonly entity: "nft" | "resource";

  constructor(nftId: string, entity: "nft" | "resource", id: string) {
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
      return new this(nftId, entity as Accept["entity"], id);
    } catch (e) {
      console.error(e.message);
      console.log(`ACCEPT error: full input was ${remark}`);
      return e.message;
    }
  }
}
