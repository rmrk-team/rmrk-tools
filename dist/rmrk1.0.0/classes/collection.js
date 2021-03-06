import { validateCollection } from "../../tools/validate-remark";
import { getRemarkData } from "../../tools/utils";
import { OP_TYPES } from "../../tools/constants";
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
        return `RMRK::${OP_TYPES.MINT}::${Collection.V}::${encodeURIComponent(JSON.stringify({
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
    static fromRemark(remark, block = 0) {
        try {
            validateCollection(remark);
            const [prefix, op_type, version, dataString] = remark.split("::");
            const obj = getRemarkData(dataString);
            return new this(block, obj.name, obj.max, obj.issuer, obj.symbol, obj.id, obj.metadata);
        }
        catch (e) {
            console.error(e.message);
            console.log(`${OP_TYPES.MINT} error: full input was ${remark}`);
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
Collection.V = "1.0.0";
export var DisplayType;
(function (DisplayType) {
    DisplayType[DisplayType["null"] = 0] = "null";
    DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
    DisplayType[DisplayType["number"] = 2] = "number";
    DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
})(DisplayType || (DisplayType = {}));
//# sourceMappingURL=collection.js.map