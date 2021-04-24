#! /usr/bin/env node
import {IStorageProvider, RemarkListener} from "../src/listener";
import { getApi } from "../src/tools/utils";
import { Remark } from "../src/tools/consolidator/remark";
import { Consolidator } from "../src";

class StorageProvider implements IStorageProvider {
  readonly storageKey: string;
  private latestBlock: number;

  constructor(storageKey?: string) {
    this.storageKey = storageKey || 'latestBlock';
    this.latestBlock = 7062175;
  }

  public set = async (latestBlock: number) => {
    this.latestBlock = latestBlock;
    // await db.substrate.update(0, { latestBlock });
  };

  public get = async () => {
    return this.latestBlock;
    // const substrateConfig = await db.substrate.get(0);
    // return substrateConfig?.latestBlock || 0;
  };
}

const storageProvider = new StorageProvider();


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
    storageProvider,
  });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));

  const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
  unfinilisedSubscriber.subscribe((val) =>
    console.log("Unfinalised remarks:", val)
  );
};

runListener();
