(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@polkadot/api'), require('@polkadot/util'), require('url'), require('@polkadot/keyring')) :
    typeof define === 'function' && define.amd ? define(['exports', '@polkadot/api', '@polkadot/util', 'url', '@polkadot/keyring'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.rmrkTools = {}, global.api, global.util, global.url, global.keyring));
}(this, (function (exports, api, util, url, keyring) { 'use strict';

    class Collection {
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
    var DisplayType$1;
    (function (DisplayType) {
        DisplayType[DisplayType["null"] = 0] = "null";
        DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
        DisplayType[DisplayType["number"] = 2] = "number";
        DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
    })(DisplayType$1 || (DisplayType$1 = {}));

    class NFT {
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
            const exploded = remark.split("::");
            try {
                if (exploded[0].toUpperCase() != "RMRK")
                    throw new Error("Invalid remark - does not start with RMRK");
                if (exploded[1] != "MINTNFT")
                    throw new Error("The op code needs to be MINTNFT, is " + exploded[1]);
                if (exploded[2] != NFT.V) {
                    throw new Error(`This remark was issued under version ${exploded[2]} instead of ${NFT.V}`);
                }
                const data = decodeURIComponent(exploded[3]);
                const obj = JSON.parse(data);
                if (!obj)
                    throw new Error(`Could not parse object from: ${data}`);
                // Check if the object has either data or metadata
                if ((undefined === obj.metadata ||
                    (!obj.metadata.startsWith("ipfs") &&
                        !obj.metadata.startsWith("http"))) &&
                    undefined === obj.data)
                    throw new Error(`Invalid metadata (not an HTTP or IPFS URL) and missing data`);
                if (obj.data) {
                    NFT.checkDataFormat(obj.data);
                }
                if (undefined === obj.name)
                    throw new Error(`Missing field: name`);
                if (undefined === obj.collection)
                    throw new Error(`Missing field: collection`);
                if (undefined === obj.instance)
                    throw new Error(`Missing field: instance`);
                if (undefined === obj.transferable)
                    throw new Error(`Missing field: transferable`);
                if (undefined === obj.sn)
                    throw new Error(`Missing field: sn`);
                return new this(block, obj.collection, obj.name, obj.instance, obj.transferable, obj.sn, obj.metadata, obj.data);
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
    NFT.V = "RMRK1.0.0";
    var DisplayType;
    (function (DisplayType) {
        DisplayType[DisplayType["null"] = 0] = "null";
        DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
        DisplayType[DisplayType["number"] = 2] = "number";
        DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
    })(DisplayType || (DisplayType = {}));

    class ChangeIssuer {
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

    class Send {
        constructor(id, recipient) {
            this.recipient = recipient;
            this.id = id;
        }
        static fromRemark(remark) {
            const exploded = remark.split("::");
            try {
                if (exploded[0] != "RMRK")
                    throw new Error("Invalid remark - does not start with RMRK");
                if (exploded[2] != Send.V)
                    throw new Error(`Version mismatch. Is ${exploded[2]}, should be ${Send.V}`);
                if (exploded[1] != "SEND")
                    throw new Error("The op code needs to be SEND, is " + exploded[1]);
                if (undefined === exploded[3] || undefined == exploded[4]) {
                    throw new Error("Cound not find ID or recipient");
                }
            }
            catch (e) {
                console.error(e.message);
                console.log(`SEND error: full input was ${remark}`);
                return e.message;
            }
            return new Send(exploded[3], exploded[4]);
        }
    }
    Send.V = "RMRK1.0.0";

    class Emote {
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
    Emote.V = "RMRK1.0.0";

    var OP_TYPES;
    (function (OP_TYPES) {
        OP_TYPES["BUY"] = "BUY";
        OP_TYPES["LIST"] = "LIST";
        OP_TYPES["MINT"] = "MINT";
        OP_TYPES["MINTNFT"] = "MINTNFT";
        OP_TYPES["SEND"] = "SEND";
        OP_TYPES["EMOTE"] = "EMOTE";
        OP_TYPES["CHANGEISSUER"] = "CHANGEISSUER";
    })(OP_TYPES || (OP_TYPES = {}));

    const getApi = async (wsEndpoint) => {
        const wsProvider = new api.WsProvider(wsEndpoint);
        const api$1 = api.ApiPromise.create({ provider: wsProvider });
        return api$1;
    };
    const getLatestBlock = async (api) => {
        const header = await api.rpc.chain.getHeader();
        return header.number.toNumber();
    };
    const getLatestFinalizedBlock = async (api) => {
        const hash = await api.rpc.chain.getFinalizedHead();
        const header = await api.rpc.chain.getHeader(hash);
        if (header.number.toNumber() === 0) {
            console.error("Unable to retrieve finalized head - returned genesis block");
            process.exit(1);
        }
        return header.number.toNumber();
    };
    const deeplog = function (obj) {
        console.log(JSON.stringify(obj, null, 2));
    };
    const stringIsAValidUrl = (s) => {
        try {
            new url.URL(s);
            return true;
        }
        catch (err) {
            return false;
        }
    };
    const prefixToArray = function (prefix) {
        const returnArray = [];
        const exploded = prefix.split(",");
        for (const p of exploded) {
            if (p.indexOf("0x") === 0) {
                returnArray.push(p);
            }
            else {
                returnArray.push(util.stringToHex(p));
            }
        }
        return returnArray;
    };
    const getMeta = (call, block) => {
        const str = util.hexToString(call.value);
        const arr = str.split("::");
        if (arr.length < 3) {
            console.error(`Invalid RMRK in block ${block}: ${str}`);
            return false;
        }
        return {
            type: arr[1],
            version: parseFloat(arr[2]) ? arr[2] : "0.1",
        };
    };
    const getRemarksFromBlocks = (blocks) => {
        const remarks = [];
        for (const row of blocks) {
            for (const call of row.calls) {
                if (call.call !== "system.remark")
                    continue;
                const meta = getMeta(call, row.block);
                if (!meta)
                    continue;
                let remark;
                switch (meta.type) {
                    case OP_TYPES.MINTNFT:
                    case OP_TYPES.MINT:
                        remark = decodeURI(util.hexToString(call.value));
                        break;
                    default:
                        remark = util.hexToString(call.value);
                        break;
                }
                const r = {
                    block: row.block,
                    caller: call.caller,
                    interaction_type: meta.type,
                    version: meta.version,
                    remark: remark,
                };
                remarks.push(r);
            }
        }
        return remarks;
    };

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getApi: getApi,
        getLatestBlock: getLatestBlock,
        getLatestFinalizedBlock: getLatestFinalizedBlock,
        deeplog: deeplog,
        stringIsAValidUrl: stringIsAValidUrl,
        prefixToArray: prefixToArray,
        getRemarksFromBlocks: getRemarksFromBlocks
    });

    // import * as fs from "fs";
    class Consolidator {
        constructor(initializedAdapter) {
            if (initializedAdapter) {
                this.adapter = initializedAdapter;
            }
            this.invalidCalls = [];
            this.collections = [];
            this.nfts = [];
        }
        findExistingCollection(id) {
            return this.collections.find((el) => el.id === id);
        }
        updateInvalidCalls(op_type, remark) {
            const invalidCallBase = {
                op_type,
                block: remark.block,
                caller: remark.caller,
            };
            return function update(object_id, message) {
                this.invalidCalls.push(Object.assign(Object.assign({}, invalidCallBase), { object_id,
                    message }));
            };
        }
        mint(remark) {
            // A new collection was created
            console.log("Instantiating collection");
            const invalidate = this.updateInvalidCalls(OP_TYPES.MINT, remark).bind(this);
            const c = Collection.fromRemark(remark.remark, remark.block);
            if (typeof c === "string") {
                // console.log(
                //   "Collection was not instantiated OK from " + remark.remark
                // );
                invalidate(remark.remark, `[${OP_TYPES.MINT}] Dead before instantiation: ${c}`);
                return true;
            }
            //console.log("Collection instantiated OK from " + remark.remark);
            const pubkey = keyring.decodeAddress(remark.caller);
            const id = Collection.generateId(util.u8aToHex(pubkey), c.symbol);
            if (this.findExistingCollection(c.id)) {
                invalidate(c.id, `[${OP_TYPES.MINT}] Attempt to mint already existing collection`);
                return true;
            }
            if (id.toLowerCase() !== c.id.toLowerCase()) {
                invalidate(c.id, `Caller's pubkey ${util.u8aToHex(pubkey)} (${id}) does not match generated ID`);
                return true;
            }
            this.collections.push(c);
            return false;
        }
        mintNFT(remark) {
            // A new NFT was minted into a collection
            console.log("Instantiating nft");
            const invalidate = this.updateInvalidCalls(OP_TYPES.MINTNFT, remark).bind(this);
            const n = NFT.fromRemark(remark.remark, remark.block);
            if (typeof n === "string") {
                invalidate(remark.remark, `[${OP_TYPES.MINTNFT}] Dead before instantiation: ${n}`);
                return true;
            }
            const nftParent = this.findExistingCollection(n.collection);
            if (!nftParent) {
                invalidate(n.getId(), `NFT referencing non-existant parent collection ${n.collection}`);
                return true;
            }
            n.owner = nftParent.issuer;
            if (remark.caller != n.owner) {
                invalidate(n.getId(), `Attempted issue of NFT in non-owned collection. Issuer: ${nftParent.issuer}, caller: ${remark.caller}`);
                return true;
            }
            const existsCheck = this.nfts.find((el) => {
                const idExpand1 = el.getId().split("-");
                idExpand1.shift();
                const uniquePart1 = idExpand1.join("-");
                const idExpand2 = n.getId().split("-");
                idExpand2.shift();
                const uniquePart2 = idExpand2.join("-");
                return uniquePart1 === uniquePart2;
            });
            if (existsCheck) {
                invalidate(n.getId(), `[${OP_TYPES.MINTNFT}] Attempt to mint already existing NFT`);
                return true;
            }
            if (n.owner === "") {
                invalidate(n.getId(), `[${OP_TYPES.MINTNFT}] Somehow this NFT still doesn't have an owner.`);
                return true;
            }
            this.nfts.push(n);
            return false;
        }
        send(remark) {
            // An NFT was sent to a new owner
            console.log("Instantiating send");
            const send = Send.fromRemark(remark.remark);
            const invalidate = this.updateInvalidCalls(OP_TYPES.SEND, remark).bind(this);
            if (typeof send === "string") {
                invalidate(remark.remark, `[${OP_TYPES.SEND}] Dead before instantiation: ${send}`);
                return true;
            }
            const nft = this.nfts.find((el) => {
                const idExpand1 = el.getId().split("-");
                idExpand1.shift();
                const uniquePart1 = idExpand1.join("-");
                const idExpand2 = send.id.split("-");
                idExpand2.shift();
                const uniquePart2 = idExpand2.join("-");
                return uniquePart1 === uniquePart2;
            });
            // @todo add condition for transferable!
            if (!nft) {
                invalidate(send.id, `[${OP_TYPES.SEND}] Attempting to send non-existant NFT ${send.id}`);
                return true;
            }
            // Check if allowed to issue send - if owner == caller
            if (nft.owner != remark.caller) {
                invalidate(send.id, `[${OP_TYPES.SEND}] Attempting to send non-owned NFT ${send.id}, real owner: ${nft.owner}`);
                return true;
            }
            nft.addChange({
                field: "owner",
                old: nft.owner,
                new: send.recipient,
                caller: remark.caller,
                block: remark.block,
            });
            nft.owner = send.recipient;
            return false;
        }
        emote(remark) {
            // An EMOTE reaction has been sent
            console.log("Instantiating emote");
            const emote = Emote.fromRemark(remark.remark);
            const invalidate = this.updateInvalidCalls(OP_TYPES.EMOTE, remark).bind(this);
            if (typeof emote === "string") {
                invalidate(remark.remark, `[${OP_TYPES.EMOTE}] Dead before instantiation: ${emote}`);
                return true;
            }
            const target = this.nfts.find((el) => el.getId() === emote.id);
            if (!target) {
                invalidate(emote.id, `[${OP_TYPES.EMOTE}] Attempting to emote on non-existant NFT ${emote.id}`);
                return true;
            }
            const index = target.reactions[emote.unicode].indexOf(remark.caller, 0);
            if (index > -1) {
                target.reactions[emote.unicode].splice(index, 1);
            }
            else {
                target.reactions[emote.unicode].push(remark.caller);
            }
            return false;
        }
        changeIssuer(remark) {
            // The ownership of a collection has changed
            console.log("Instantiating an issuer change");
            const ci = ChangeIssuer.fromRemark(remark.remark);
            const invalidate = this.updateInvalidCalls(OP_TYPES.CHANGEISSUER, remark).bind(this);
            if (typeof ci === "string") {
                // console.log(
                //   "ChangeIssuer was not instantiated OK from " + remark.remark
                // );
                invalidate(remark.remark, `[${OP_TYPES.CHANGEISSUER}] Dead before instantiation: ${ci}`);
                return true;
            }
            const coll = this.collections.find((el) => el.id === ci.id);
            if (!coll) {
                invalidate(ci.id, `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such collection with ID ${ci.id} found before block ${remark.block}!`);
                return true;
            }
            if (remark.caller != coll.issuer) {
                invalidate(ci.id, `Attempting to change issuer of collection ${ci.id} when not issuer!`);
                return true;
            }
            coll.addChange({
                field: "issuer",
                old: coll.issuer,
                new: ci.issuer,
                caller: remark.caller,
                block: remark.block,
            });
            coll.issuer = ci.issuer;
            return false;
        }
        consolidate(rmrks) {
            var _a;
            const remarks = rmrks || ((_a = this.adapter) === null || _a === void 0 ? void 0 : _a.getRemarks()) || [];
            //console.log(remarks);
            for (const remark of remarks) {
                console.log("==============================");
                console.log("Remark is: " + remark.remark);
                switch (remark.interaction_type) {
                    case OP_TYPES.MINT:
                        if (this.mint(remark)) {
                            continue;
                        }
                        break;
                    case OP_TYPES.MINTNFT:
                        if (this.mintNFT(remark)) {
                            continue;
                        }
                        break;
                    case OP_TYPES.SEND:
                        if (this.send(remark)) {
                            continue;
                        }
                        break;
                    case OP_TYPES.BUY:
                        // An NFT was bought after being LISTed
                        break;
                    case OP_TYPES.LIST:
                        // An NFT was listed for sale
                        break;
                    case OP_TYPES.EMOTE:
                        if (this.emote(remark)) {
                            continue;
                        }
                        break;
                    case OP_TYPES.CHANGEISSUER:
                        if (this.changeIssuer(remark)) {
                            continue;
                        }
                        break;
                    default:
                        console.error("Unable to process this remark - wrong type: " +
                            remark.interaction_type);
                }
            }
            deeplog(this.nfts);
            deeplog(this.collections);
            console.log(this.invalidCalls);
        }
    }

    var fetchRemarks = async (api, from, to, prefixes) => {
        const bcs = [];
        for (let i = from; i <= to; i++) {
            if (i % 1000 === 0) {
                const event = new Date();
                console.log(`Block ${i} at time ${event.toTimeString()}`);
                if (i % 5000 === 0) {
                    console.log(`Currently at ${bcs.length} remarks.`);
                }
            }
            const blockHash = await api.rpc.chain.getBlockHash(i);
            const block = await api.rpc.chain.getBlock(blockHash);
            const bc = [];
            if (block.block === undefined) {
                console.error("block.block is undefined for block " + i);
                deeplog(block);
                continue;
            }
            let exIndex = 0;
            exLoop: for (const ex of block.block.extrinsics) {
                if (ex.isEmpty || !ex.isSigned) {
                    exIndex++;
                    continue;
                }
                const { method: { args, method, section }, } = ex;
                if (section === "system" && method === "remark") {
                    const remark = args.toString();
                    if (prefixes.some((word) => remark.startsWith(word))) {
                        //if (remark.indexOf(prefix) === 0) {
                        bc.push({
                            call: "system.remark",
                            value: remark,
                            caller: ex.signer.toString(),
                        });
                    }
                }
                else if (section === "utility" &&
                    (method === "batch" || method == "batchAll")) {
                    // @ts-ignore
                    const batchargs = args[0];
                    let remarkExists = false;
                    batchargs.forEach((el) => {
                        if (el.section === "system" &&
                            el.method === "remark" &&
                            prefixes.some((word) => el.args.toString().startsWith(word))) {
                            remarkExists = true;
                        }
                    });
                    if (remarkExists) {
                        const records = await api.query.system.events.at(blockHash);
                        const events = records.filter(({ phase, event }) => phase.isApplyExtrinsic &&
                            phase.asApplyExtrinsic.eq(exIndex) &&
                            event.method.toString() === "BatchInterrupted");
                        if (events.length) {
                            console.log(`Skipping batch ${i}-${exIndex} due to BatchInterrupted`);
                            exIndex++;
                            continue exLoop;
                        }
                        batchargs.forEach((el) => {
                            bc.push({
                                call: `${el.section}.${el.method}`,
                                value: el.args.toString(),
                                caller: ex.signer.toString(),
                            });
                        });
                    }
                }
                exIndex++;
            }
            if (bc.length) {
                bcs.push({
                    block: i,
                    calls: bc,
                });
            }
        }
        return bcs;
    };

    exports.Consolidator = Consolidator;
    exports.c100 = Collection;
    exports.fetchRemarks = fetchRemarks;
    exports.n100 = NFT;
    exports.utils = utils;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
