import { validateConsume } from "../../tools/validate-remark";

export class Consume {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Consume | string {
    try {
      validateConsume(remark);
      const [_prefix, _op_type, _version, ...rest] = remark.split("::");
      const id = remark.slice(
        remark.indexOf(rest[0]),
        rest.length > 1 ? remark.lastIndexOf("::") : remark.length
      );
      return new Consume(id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`CONSUME error: full input was ${remark}`);
      return e.message;
    }
  }
}
