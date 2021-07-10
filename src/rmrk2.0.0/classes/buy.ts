import { validateBuy } from "../tools/validate-remark";

export class Buy {
  id: string;
  readonly recipient?: string;

  constructor(id: string, recipient?: string) {
    this.id = id;
    this.recipient = recipient;
  }

  static fromRemark(remark: string): Buy | string {
    try {
      validateBuy(remark);
      const [_prefix, _op_type, _version, id, recipient] = remark.split("::");
      return new Buy(id, recipient);
    } catch (e) {
      console.error(e.message);
      console.log(`BUY error: full input was ${remark}`);
      return e.message;
    }
  }
}
