import { validateLock } from "../tools/validate-remark";

export class Lock {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Lock | string {
    try {
      validateLock(remark);
      const [prefix, op_type, version, id] = remark.split("::");
      return new Lock(id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`LOCK error: full input was ${remark}`);
      return e.message;
    }
  }
}
