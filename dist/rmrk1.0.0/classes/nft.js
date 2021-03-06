import { validateNFT } from "../../tools/validate-remark";
import { getRemarkData } from "../../tools/utils";
export class NFT {
    constructor(block, collection, name, instance, transferable, sn, metadata, data) {
        this.changes = [];
        this.block = block;
        this.collection = collection;
        this.name = name;
        this.instance = instance;
        this.transferable = transferable;
        this.sn = sn;
        this.data = data;
        this.metadata = metadata;
        this.owner = "";
        this.reactions = {};
        this.forsale = false;
    }
    getId() {
        if (!this.block)
            throw new Error("This token is not minted, so it cannot have an ID.");
        return `${this.block}-${this.collection}-${this.instance}-${this.sn}`;
    }
    addChange(c) {
        this.changes.push(c);
        return this;
    }
    mintnft() {
        if (this.block) {
            throw new Error("An already existing NFT cannot be minted!");
        }
        return `RMRK::MINTNFT::${NFT.V}::${encodeURIComponent(JSON.stringify({
            collection: this.collection,
            name: this.name,
            instance: this.instance,
            transferable: this.transferable,
            sn: this.sn,
            metadata: this.metadata,
        }))}`;
    }
    send(recipient) {
        if (!this.block) {
            throw new Error(`You can only send an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::SEND::${NFT.V}::${this.getId()}::${recipient}`;
    }
    // @todo build this out, maybe data type?
    static checkDataFormat(data) {
        return true;
    }
    static fromRemark(remark, block) {
        if (!block) {
            block = 0;
        }
        try {
            validateNFT(remark);
            const [prefix, op_type, version, dataString] = remark.split("::");
            const obj = getRemarkData(dataString);
            return new this(block, obj.collection, obj.name, obj.instance, typeof obj.transferable === "number"
                ? obj.transferable
                : parseInt(obj.transferable, 10), obj.sn, obj.metadata, obj.data);
        }
        catch (e) {
            console.error(e.message);
            console.log(`MINTNFT error: full input was ${remark}`);
            return e.message;
        }
    }
    /**
     * @param price In plancks, so 10000000000 for 0.01 KSM. Set to 0 if canceling listing.
     */
    list(price) {
        if (!this.block) {
            throw new Error(`You can only list an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::LIST::${NFT.V}::${this.getId()}::${price > 0 ? price : "cancel"}`;
    }
    buy() {
        if (!this.block) {
            throw new Error(`You can only buy an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::BUY::${NFT.V}::${this.getId()}`;
    }
    consume() {
        if (!this.block) {
            throw new Error(`You can only consume an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::CONSUME::${NFT.V}::${this.getId()}`;
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
NFT.V = "1.0.0";
export var DisplayType;
(function (DisplayType) {
    DisplayType[DisplayType["null"] = 0] = "null";
    DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
    DisplayType[DisplayType["number"] = 2] = "number";
    DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
})(DisplayType || (DisplayType = {}));
//# sourceMappingURL=nft.js.map