import { RemarkListener } from "../src/listener";
import { WsProvider } from "@polkadot/api";

const wsProvider = new WsProvider("wss://node.rmrk.app");

const test = async () => {
  const listener = new RemarkListener({ providerInterface: wsProvider, prefixes: [] });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));
};

test();
