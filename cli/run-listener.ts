#! /usr/bin/env node
import { RemarkListener } from "../src/listener";
import { WsProvider } from "@polkadot/api";
import defaultDump from "../dumps/remarks-4892957-6619194-0x726d726b,0x524d524b.json";

const wsProvider = new WsProvider("wss://node.rmrk.app");

const runListener = async () => {
  const listener = new RemarkListener({
    providerInterface: wsProvider,
    prefixes: [],
    initialBlockCalls: defaultDump,
  });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));

  const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
  unfinilisedSubscriber.subscribe((val) =>
    console.log("Unfinalised remarks:", val)
  );
};

runListener();
