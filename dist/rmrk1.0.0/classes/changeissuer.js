import { validateChangeIssuer } from "../../tools/validate-remark";
export class ChangeIssuer {
    constructor(issuer, id) {
        this.issuer = issuer;
        this.id = id;
    }
    static fromRemark(remark) {
        const exploded = remark.split("::");
        try {
            validateChangeIssuer(remark);
            const [prefix, op_type, version, id, issuer] = remark.split("::");
            return new ChangeIssuer(id, issuer);
        }
        catch (e) {
            console.error(e.message);
            console.log(`CHANGEISSUER error: full input was ${remark}`);
            return e.message;
        }
    }
}
//# sourceMappingURL=changeissuer.js.map