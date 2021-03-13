import { validateBuy } from "../../tools/validate-remark";

export class Buy {
  price: BigInt;
  id: string;

  constructor(id: string, price: BigInt) {
    this.price = price;
    this.id = id;
  }

  static fromRemark(remark: string): Buy | string {
    try {
      validateBuy(remark);
      const [_prefix, _op_type, _version, id, price] = remark.split("::");
      return new Buy(id, BigInt(price));
    } catch (e) {
      console.error(e.message);
      console.log(`SEND error: full input was ${remark}`);
      return e.message;
    }
  }
}
