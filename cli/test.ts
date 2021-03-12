import { RemarkListener } from "../src/listener";
import { WsProvider } from "@polkadot/api";

const wsProvider = new WsProvider("wss://node.rmrk.app");

const test = async () => {
  const listener = new RemarkListener(wsProvider);
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));
  await listener.initialize();
};

test();
