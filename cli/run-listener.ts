#! /usr/bin/env node
import { RemarkListener } from "../src/listener";
import { WsProvider } from "@polkadot/api";
import defaultDump from "../dumps/latest.json";
import { BlockCalls } from "../src/tools/types";

const wsProvider = new WsProvider("wss://node.rmrk.app");

const runListener = async () => {
  const listener = new RemarkListener({
    providerInterface: wsProvider,
    prefixes: [],
    initialBlockCalls: defaultDump as BlockCalls[],
  });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));

  const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
  unfinilisedSubscriber.subscribe((val) =>
    console.log("Unfinalised remarks:", val)
  );
};

runListener();
