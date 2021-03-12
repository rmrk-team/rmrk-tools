import { RemarkListener } from "../src/listener";
import { WsProvider } from "@polkadot/api";

const wsProvider = new WsProvider("wss://node.rmrk.app");

const test = async () => {
  const listener = new RemarkListener(
    wsProvider,
    "https://gateway.pinata.cloud/ipfs/QmNSkd7e5ShjpvqJUGjub1fD6Tg2g3YqDBdgnkC3jgCjCR"
  );

  await listener.initialize();
};

test();
