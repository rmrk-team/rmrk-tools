import { validateBuy } from "../../tools/validate-remark";

export class Buy {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Buy | string {
    try {
      validateBuy(remark);
      const [_prefix, _op_type, _version, ...rest] = remark.split("::");
      const id = remark.slice(
        remark.indexOf(rest[0]),
        rest.length > 1 ? remark.lastIndexOf("::") : remark.length
      );
      return new Buy(id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`BUY error: full input was ${remark}`);
      return e.message;
    }
  }
}
