import { validateSetAttribute } from "../tools/validate-remark";
import { IAttribute } from "../tools/types";
import { getRemarkData } from "../tools/utils";

export class Setproperty {
  key: string;
  property: Partial<IAttribute>;
  id: string;
  freeze?: "freeze";

  constructor(
    id: string,
    key: string,
    property: Partial<IAttribute>,
    freeze?: "freeze"
  ) {
    this.id = id;
    this.property = property;
    this.key = key;
    this.freeze = freeze;
  }

  static fromRemark(remark: string): Setproperty | string {
    try {
      validateSetAttribute(remark);
      const [
        _prefix,
        _op_type,
        _version,
        id,
        key,
        property,
        freeze,
      ] = remark.split("::");
      const attributeObj: Partial<IAttribute> = getRemarkData(property);
      if (freeze && freeze !== "freeze") {
        throw new Error(`Not a valid freeze ${freeze}`);
      }
      return new Setproperty(id, key, attributeObj, freeze as "freeze");
    } catch (e: any) {
      console.error(e.message);
      console.log(`SETPROPERTY error: full input was ${remark}`);
      return e.message;
    }
  }
}
