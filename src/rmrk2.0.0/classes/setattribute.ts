import { validateSetAttribute } from "../tools/validate-remark";
import { IAttribute } from "../tools/types";
import { getRemarkData } from "../tools/utils";

export class SetAttribute {
  key: string;
  attribute: Partial<IAttribute>;
  id: string;
  freeze?: "freeze";

  constructor(
    id: string,
    key: string,
    attribute: Partial<IAttribute>,
    freeze?: "freeze"
  ) {
    this.id = id;
    this.attribute = attribute;
    this.key = key;
    this.freeze = freeze;
  }

  static fromRemark(remark: string): SetAttribute | string {
    try {
      validateSetAttribute(remark);
      const [
        _prefix,
        _op_type,
        _version,
        id,
        key,
        attribute,
        freeze,
      ] = remark.split("::");
      const attributeObj: Partial<IAttribute> = getRemarkData(attribute);
      if (freeze && freeze !== "freeze") {
        throw new Error(`Not a valid freeze ${freeze}`);
      }
      return new SetAttribute(id, key, attributeObj, freeze as "freeze");
    } catch (e) {
      console.error(e.message);
      console.log(`SETATTRIBUTE error: full input was ${remark}`);
      return e.message;
    }
  }
}
