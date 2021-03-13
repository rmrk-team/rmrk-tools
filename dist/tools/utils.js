import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString, stringToHex } from "@polkadot/util";
import { URL } from "url";
import { OP_TYPES } from "./constants";
export const getApi = async (wsEndpoint) => {
    const wsProvider = new WsProvider(wsEndpoint);
    const api = ApiPromise.create({ provider: wsProvider });
    return api;
};
export const getLatestBlock = async (api) => {
    const header = await api.rpc.chain.getHeader();
    return header.number.toNumber();
};
export const getLatestFinalizedBlock = async (api) => {
    const hash = await api.rpc.chain.getFinalizedHead();
    const header = await api.rpc.chain.getHeader(hash);
    if (header.number.toNumber() === 0) {
        console.error("Unable to retrieve finalized head - returned genesis block");
        process.exit(1);
    }
    return header.number.toNumber();
};
export const deeplog = function (obj) {
    //@ts-ignore
    BigInt.prototype.toJSON = function () {
        return this.toString();
    };
    console.log(JSON.stringify(obj, null, 2));
};
export const stringIsAValidUrl = (s) => {
    try {
        new URL(s);
        return true;
    }
    catch (err) {
        return false;
    }
};
export const prefixToArray = function (prefix) {
    const returnArray = [];
    const exploded = prefix.split(",");
    for (const p of exploded) {
        if (p.indexOf("0x") === 0) {
            returnArray.push(p);
        }
        else {
            returnArray.push(stringToHex(p));
        }
    }
    return returnArray;
};
const getMeta = (call, block) => {
    const str = hexToString(call.value);
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
export const getRemarksFromBlocks = (blocks) => {
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
                    remark = decodeURI(hexToString(call.value));
                    break;
                default:
                    remark = hexToString(call.value);
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
export const isBatchInterrupted = async (api, blockHash, extrinsicIndex) => {
    const records = await api.query.system.events.at(blockHash);
    const events = records.filter(({ phase, event }) => phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.eq(extrinsicIndex) &&
        (event.method.toString() === "BatchInterrupted" ||
            event.method.toString() === "ExtrinsicFailed"));
    return Boolean(events.length);
};
const isSystemRemark = (call, prefixes) => {
    return (call.section === "system" &&
        call.method === "remark" &&
        prefixes.some((word) => call.args.toString().startsWith(word)));
};
const isUtilityBatch = (call) => call.section === "utility" &&
    (call.method === "batch" || call.method === "batchAll");
export const getBlockCallsFromSignedBlock = async (signedBlock, prefixes, api) => {
    var _a, _b, _c;
    const blockCalls = [];
    const extrinsics = (_a = signedBlock === null || signedBlock === void 0 ? void 0 : signedBlock.block) === null || _a === void 0 ? void 0 : _a.extrinsics;
    if (!Array.isArray(extrinsics)) {
        return blockCalls;
    }
    let extrinsicIndex = 0;
    for (const extrinsic of extrinsics) {
        if (extrinsic.isEmpty || !extrinsic.isSigned) {
            extrinsicIndex++;
            continue;
        }
        if (isSystemRemark(extrinsic.method, prefixes)) {
            blockCalls.push({
                call: "system.remark",
                value: extrinsic.args.toString(),
                caller: extrinsic.signer.toString(),
            });
        }
        else if (isUtilityBatch(extrinsic.method)) {
            // @ts-ignore
            const batchArgs = extrinsic.method.args[0];
            let remarkExists = false;
            batchArgs.forEach((el) => {
                if (isSystemRemark(el, prefixes)) {
                    remarkExists = true;
                }
            });
            if (remarkExists) {
                const skip = await isBatchInterrupted(api, signedBlock.block.hash, extrinsicIndex);
                if (skip) {
                    console.log(`Skipping batch ${(_c = (_b = signedBlock.block) === null || _b === void 0 ? void 0 : _b.header) === null || _c === void 0 ? void 0 : _c.number}-${extrinsicIndex} due to BatchInterrupted`);
                    extrinsicIndex++;
                    continue;
                }
                batchArgs.forEach((el) => {
                    blockCalls.push({
                        call: `${el.section}.${el.method}`,
                        value: el.args.toString(),
                        caller: extrinsic.signer.toString(),
                    });
                });
            }
        }
        extrinsicIndex++;
    }
    return blockCalls;
};
export const getRemarkData = (dataString) => {
    const data = decodeURIComponent(dataString);
    return JSON.parse(data);
};
//# sourceMappingURL=utils.js.map