import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString, stringToHex } from "@polkadot/util";
import { URL } from "url";
import { OP_TYPES } from "./types";
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
//# sourceMappingURL=utils.js.map