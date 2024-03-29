import { validateLock } from "../tools/validate-remark";

export class Lock {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Lock | string {
    try {
      validateLock(remark);
      const [_prefix, _op_type, _version, id] = remark.split("::");
      return new this(id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`LOCK error: full input was ${remark}`);
      return e.message;
    }
  }
}
