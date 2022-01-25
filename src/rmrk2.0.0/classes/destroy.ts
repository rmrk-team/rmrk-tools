import { validateDestroy } from "../tools/validate-remark";

export class Destroy {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Destroy | string {
    try {
      validateDestroy(remark);
      const [_prefix, _op_type, _version, id] = remark.split("::");
      return new this(id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`DESTROY error: full input was ${remark}`);
      return e.message;
    }
  }
}
