import { validateConsume } from "../../tools/validate-remark";

export class Consume {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Consume | string {
    try {
      validateConsume(remark);
      const [_prefix, _op_type, _version, id] = remark.split("::");
      return new Consume(id);
    } catch (e) {
      console.error(e.message);
      console.log(`CONSUME error: full input was ${remark}`);
      return e.message;
    }
  }
}
