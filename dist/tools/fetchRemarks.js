import { deeplog, getBlockCallsFromSignedBlock } from "../tools/utils";
export default async (api, from, to, prefixes) => {
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
        if (block.block === undefined) {
            console.error("block.block is undefined for block " + i);
            deeplog(block);
            continue;
        }
        const blockCalls = await getBlockCallsFromSignedBlock(block, prefixes, api);
        if (blockCalls.length) {
            bcs.push({
                block: i,
                calls: blockCalls,
            });
        }
    }
    return bcs;
};
//# sourceMappingURL=fetchRemarks.js.map