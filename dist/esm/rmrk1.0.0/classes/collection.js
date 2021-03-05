export class Collection {
    constructor(block, name, max, issuer, symbol, id, metadata) {
        this.changes = [];
        this.block = block;
        this.name = name;
        this.max = max;
        this.issuer = issuer;
        this.symbol = symbol;
        this.id = id;
        this.metadata = metadata;
    }
    mint() {
        if (this.block) {
            throw new Error("An already existing collection cannot be minted!");
        }
        return `RMRK::MINT::${Collection.V}::${encodeURIComponent(JSON.stringify({
            name: this.name,
            max: this.max,
            issuer: this.issuer,
            symbol: this.symbol.toUpperCase(),
            id: this.id,
            metadata: this.metadata,
        }))}`;
    }
    change_issuer(address) {
        if (this.block === 0) {
            throw new Error("This collection is new, so there's no issuer to change." +
                " If it has been deployed on chain, load the existing " +
                "collection as a new instance first, then change issuer.");
        }
        return `RMRK::CHANGEISSUER::${Collection.V}::${this.id}::${address}`;
    }
    addChange(c) {
        this.changes.push(c);
        return this;
    }
    getChanges() {
        return this.changes;
    }
    static generateId(pubkey, symbol) {
        if (!pubkey.startsWith("0x")) {
            throw new Error("This is not a valid pubkey, it does not start with 0x");
        }
        //console.log(pubkey);
        return (pubkey.substr(2, 10) +
            pubkey.substring(pubkey.length - 8) +
            "-" +
            symbol.toUpperCase());
    }
    static fromRemark(remark, block) {
        if (!block) {
            block = 0;
        }
        const exploded = remark.split("::");
        try {
            if (exploded[0].toUpperCase() != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[1] != "MINT")
                throw new Error("The op code needs to be MINT, is " + exploded[1]);
            if (exploded[2] != Collection.V) {
                throw new Error(`This remark was issued under version ${exploded[2]} instead of ${Collection.V}`);
            }
            const data = decodeURIComponent(exploded[3]);
            const obj = JSON.parse(data);
            if (!obj)
                throw new Error(`Could not parse object from: ${data}`);
            if (undefined === obj.metadata ||
                (!obj.metadata.startsWith("ipfs") && !obj.metadata.startsWith("http")))
                throw new Error(`Invalid metadata - not an HTTP or IPFS URL`);
            if (undefined === obj.name)
                throw new Error(`Missing field: name`);
            if (undefined === obj.max)
                throw new Error(`Missing field: max`);
            if (undefined === obj.issuer)
                throw new Error(`Missing field: issuer`);
            if (undefined === obj.symbol)
                throw new Error(`Missing field: symbol`);
            if (undefined === obj.id)
                throw new Error(`Missing field: id`);
            return new this(block, obj.name, obj.max, obj.issuer, obj.symbol, obj.id, obj.metadata);
        }
        catch (e) {
            console.error(e.message);
            console.log(`MINT error: full input was ${remark}`);
            return e.message;
        }
    }
    /**
     * TBD - hard dependency on Axios / IPFS to fetch remote
     */
    async load_metadata() {
        if (this.loadedMetadata)
            return this.loadedMetadata;
        return {};
    }
}
Collection.V = "RMRK1.0.0";
export var DisplayType;
(function (DisplayType) {
    DisplayType[DisplayType["null"] = 0] = "null";
    DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
    DisplayType[DisplayType["number"] = 2] = "number";
    DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
})(DisplayType || (DisplayType = {}));
//# sourceMappingURL=collection.js.map