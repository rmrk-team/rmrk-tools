import { validateList } from "../../tools/validate-remark";

export class List {
  price: bigint;
  id: string;

  constructor(id: string, price: bigint) {
    this.price = price;
    this.id = id;
  }

  static fromRemark(remark: string): List | string {
    try {
      validateList(remark);
      const [_prefix, _op_type, _version, ...listArgs] = remark.split("::");

      const id = remark.slice(
        remark.indexOf(listArgs[0]),
        remark.lastIndexOf("::")
      );
      const price = listArgs.at(-1) || "";

      return new List(id, BigInt(price));
    } catch (e: any) {
      console.error(e.message);
      console.log(`LIST error: full input was ${remark}`);
      return e.message;
    }
  }
}
