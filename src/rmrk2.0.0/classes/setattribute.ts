import { validateList } from "../tools/validate-remark";

export class SetAttribute {
  name: string;
  value: string;
  id: string;

  constructor(id: string, name: string, value: string) {
    this.id = id;
    this.name = name;
    this.value = value;
  }

  static fromRemark(remark: string): SetAttribute | string {
    try {
      validateList(remark);
      const [_prefix, _op_type, _version, id, name, value] = remark.split("::");
      return new SetAttribute(id, name, value);
    } catch (e) {
      console.error(e.message);
      console.log(`SETATTRIBUTE error: full input was ${remark}`);
      return e.message;
    }
  }
}
