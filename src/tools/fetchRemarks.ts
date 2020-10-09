import { Options } from "./types";
import { getApi, getLatestBlock } from "./utils";
import { stringToHex } from "@polkadot/util";

export const fetchRemarks = async (opts: Options): Promise<void> => {
  const api = await getApi(opts.ws);
  console.log("Connecting to " + opts.ws);
  const from = parseInt(opts.from);
  const to =
    opts.to !== "latest" ? parseInt(opts.to) : await getLatestBlock(api);
  if (from > to) {
    console.error("Starting block must be less than ending block.");
    process.exit(1);
  }
  const prefix =
    opts.prefix === ""
      ? ""
      : opts.prefix.indexOf("0x") === 0
      ? opts.prefix
      : stringToHex(opts.prefix);
  console.log(`Processing block range from ${from} to ${to}.`);
  const remarks: string[] = [];
  for (let i = from; i <= to; i++) {
    const blockHash = await api.rpc.chain.getBlockHash(i);
    const block = await api.rpc.chain.getBlock(blockHash);
    block.block.extrinsics.forEach((ex) => {
      const {
        method: { args, method, section },
      } = ex;
      if (section === "system" && method === "remark") {
        const remark = args.toString();
        if (remark.indexOf(prefix) === 0) {
          remarks.push(remark);
        }
      }
    });
  }
  console.log(remarks);
  process.exit(0);
};
