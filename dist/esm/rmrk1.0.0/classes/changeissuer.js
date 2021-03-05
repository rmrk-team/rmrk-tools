export class ChangeIssuer {
    constructor(issuer, id) {
        this.issuer = issuer;
        this.id = id;
    }
    static fromRemark(remark) {
        const exploded = remark.split("::");
        try {
            if (exploded[0] != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[2] != ChangeIssuer.V)
                throw new Error(`Version mismatch. Is ${exploded[2]}, should be ${ChangeIssuer.V}`);
            if (exploded[1] != "CHANGEISSUER")
                throw new Error("The op code needs to be CHANGEISSUER, is " + exploded[1]);
            if (undefined === exploded[3] || undefined == exploded[4]) {
                throw new Error("Cound not find ID or new issuer");
            }
        }
        catch (e) {
            console.error(e.message);
            console.log(`CHANGEISSUER error: full input was ${remark}`);
            return e.message;
        }
        const ci = new ChangeIssuer(exploded[4], exploded[3]);
        return ci;
    }
}
ChangeIssuer.V = "RMRK1.0.0";
//# sourceMappingURL=changeissuer.js.map