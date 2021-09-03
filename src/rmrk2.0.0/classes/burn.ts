import { validateBurn } from "../tools/validate-remark";

export class Burn {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Burn | string {
    try {
      validateBurn(remark);
      const [_prefix, _op_type, _version, id] = remark.split("::");
      return new Burn(id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`BURN error: full input was ${remark}`);
      return e.message;
    }
  }
}
