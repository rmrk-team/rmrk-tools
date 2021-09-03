import { validateEquip } from "../tools/validate-remark";

export class Equip {
  readonly id: string;
  readonly baseslot: string;

  constructor(id: string, baseslot: string) {
    this.id = id;
    this.baseslot = baseslot;
  }

  static fromRemark(remark: string): Equip | string {
    try {
      validateEquip(remark);
      const [_prefix, _op_type, _version, id, baseslot = ""] = remark.split(
        "::"
      );
      return new this(id, baseslot);
    } catch (e: any) {
      console.error(e.message);
      console.log(`EQUIP error: full input was ${remark}`);
      return e.message;
    }
  }
}
