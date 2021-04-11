#! /usr/bin/env node
import { RemarkListener } from "../src/listener";
import { getApi } from "../src/tools/utils";
import { Remark } from "../src/tools/consolidator/remark";
import { Consolidator } from "../src";

const runListener = async () => {
  const api = await getApi("wss://node.rmrk.app");
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
