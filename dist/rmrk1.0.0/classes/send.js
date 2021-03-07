import { validateSend } from "../../tools/validate-remark";
export class Send {
    constructor(id, recipient) {
        this.recipient = recipient;
        this.id = id;
    }
    static fromRemark(remark) {
        try {
            validateSend(remark);
            const [_prefix, _op_type, _version, id, recipient] = remark.split("::");
            return new Send(id, recipient);
        }
        catch (e) {
            console.error(e.message);
            console.log(`SEND error: full input was ${remark}`);
            return e.message;
        }
    }
}
Send.V = "1.0.0";
//# sourceMappingURL=send.js.map