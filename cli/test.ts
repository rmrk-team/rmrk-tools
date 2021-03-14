import { RemarkListener } from "../src/listener";
import { WsProvider } from "@polkadot/api";

const wsProvider = new WsProvider("ws://127.0.0.1:9944");

const test = async () => {
  const listener = new RemarkListener({
    providerInterface: wsProvider,
    prefixes: [],
  });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));

  const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
  unfinilisedSubscriber.subscribe((val) => console.log('Unfinalised consolidated:', val));
};

test();
