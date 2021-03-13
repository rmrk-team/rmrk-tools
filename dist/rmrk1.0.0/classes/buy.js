import { validateBuy } from "../../tools/validate-remark";
export class Buy {
    constructor(id, price) {
        this.price = price;
        this.id = id;
    }
    static fromRemark(remark) {
        try {
            validateBuy(remark);
            const [_prefix, _op_type, _version, id, price] = remark.split("::");
            return new Buy(id, BigInt(price));
        }
        catch (e) {
            console.error(e.message);
            console.log(`SEND error: full input was ${remark}`);
            return e.message;
        }
    }
}
//# sourceMappingURL=buy.js.map