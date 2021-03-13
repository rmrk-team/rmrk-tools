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
/*
- if OP is BUY
- instantiate BUY interaction
- get price
- check if there is a matching LIST for the same NFT, if not FALSE, someone is trying to buy something not for sale
- check if BUY is in a batchAll call, if not FALSE
- check if BUY is in a batchAll call with a balances.transfer extrinsic of the same price, if not FALSE
- check if BUY is in a batchAll call with a balances.transfer extrinsic and there was ExtrinsicSuccess event on that batchAll call, return TRUE

 */
//# sourceMappingURL=buy.js.map