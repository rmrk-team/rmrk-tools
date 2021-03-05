export class Emote {
    constructor(id, unicode) {
        this.unicode = unicode;
        this.id = id;
    }
    static fromRemark(remark) {
        const exploded = remark.split("::");
        try {
            if (exploded[0] != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[2] != Emote.V)
                throw new Error(`Version mismatch. Is ${exploded[2]}, should be ${Emote.V}`);
            if (exploded[1] != "EMOTE")
                throw new Error("The op code needs to be EMOTE, is " + exploded[1]);
            if (undefined === exploded[3] || undefined == exploded[4]) {
                throw new Error("Cound not find ID or unicode");
            }
        }
        catch (e) {
            console.error(e.message);
            console.log(`EMOTE error: full input was ${remark}`);
            return e.message;
        }
        return new Emote(exploded[3], exploded[4]);
    }
}
Emote.V = "1.0.0";
//# sourceMappingURL=emote.js.map