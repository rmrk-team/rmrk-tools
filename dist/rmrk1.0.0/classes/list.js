import { validateList } from "../../tools/validate-remark";
export class List {
    constructor(id, price) {
        this.price = price;
        this.id = id;
    }
    static fromRemark(remark) {
        try {
            validateList(remark);
            const [_prefix, _op_type, _version, id, price] = remark.split("::");
            return new List(id, BigInt(price));
        }
        catch (e) {
            console.error(e.message);
            console.log(`SEND error: full input was ${remark}`);
            return e.message;
        }
    }
}
//# sourceMappingURL=list.js.map