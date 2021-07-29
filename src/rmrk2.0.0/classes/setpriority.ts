import { validateSetPriority } from "../tools/validate-remark";
import { getRemarkData } from "../../rmrk1.0.0/tools/utils";

export class Setpriority {
  id: string;
  priority: string[];

  constructor(id: string, priority: string[]) {
    this.priority = priority;
    this.id = id;
  }

  static fromRemark(remark: string): Setpriority | string {
    try {
      validateSetPriority(remark);
      const [_prefix, _op_type, _version, id, priority] = remark.split("::");
      const priorityArray: string[] = getRemarkData(priority);
      return new this(id, priorityArray);
    } catch (e) {
      console.error(e.message);
      console.log(`SETPRIORITY error: full input was ${remark}`);
      return e.message;
    }
  }
}
