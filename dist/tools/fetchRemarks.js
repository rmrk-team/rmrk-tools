import { deeplog } from "../tools/utils";
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
                        (event.method.toString() === "BatchInterrupted" ||
                            event.method.toString() === "ExtrinsicFailed"));
                    if (events.length) {
                        console.log(`Skipping batch ${i}-${exIndex} due to BatchInterrupted or ExtrinsicFailed`);
                        exIndex++;
                        continue exLoop;
                    }
                    // @todo - create extras field in remark blockcall
                    // add all batch companions into extras field
                    // should result in remark with children like balance.transfer
                    let batchRoot = {};
                    let batchExtras = [];
                    batchargs.forEach((el) => {
                        if (el.section === "system" && el.method === "remark") {
                            batchRoot = {
                                call: `${el.section}.${el.method}`,
                                value: el.args.toString(),
                                caller: ex.signer.toString(),
                            };
                        }
                        else {
                            batchExtras.push({
                                call: `${el.section}.${el.method}`,
                                value: el.args.toString(),
                                caller: ex.signer.toString(),
                            });
                        }
                    });
                    if (batchExtras.length) {
                        batchRoot.extras = batchExtras;
                    }
                    bc.push(batchRoot);
                    // batchargs.forEach((el) => {
                    //   bc.push({
                    //     call: `${el.section}.${el.method}`,
                    //     value: el.args.toString(),
                    //     caller: ex.signer.toString(),
                    //   } as BlockCall);
                    // });
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
//# sourceMappingURL=fetchRemarks.js.map