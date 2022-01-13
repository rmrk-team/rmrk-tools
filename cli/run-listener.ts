#! /usr/bin/env node
import "@polkadot/api-augment";
import { RemarkListener } from "../src/rmrk2.0.0/listener";
import { getApi } from "../src/rmrk2.0.0/tools/utils";
import { Remark } from "../src/rmrk2.0.0/tools/consolidator/remark";
import { Consolidator } from "../src/rmrk2.0.0";

const runListener = async () => {
  const api = await getApi("wss://kusama-rpc.polkadot.io");
  const consolidateFunction = async (remarks: Remark[]) => {
    const consolidator = new Consolidator();
    return await consolidator.consolidate(remarks);
  };
  const listener = new RemarkListener({
    polkadotApi: api,
    prefixes: [],
    consolidateFunction,
  });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));

  const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
  unfinilisedSubscriber.subscribe((val) =>
    console.log("Unfinalised remarks:", val)
  );
};

runListener();
