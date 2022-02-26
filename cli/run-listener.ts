#! /usr/bin/env node
import "@polkadot/api-augment";
import { IStorageProvider, RemarkListener } from "../src/rmrk2.0.0/listener";
import { getApi } from "../src/rmrk2.0.0/tools/utils";
import { Remark } from "../src/rmrk2.0.0/tools/consolidator/remark";
import { Consolidator } from "../src/rmrk2.0.0";
import { getLatestFinalizedBlock } from "../src/rmrk1.0.0";

/**
 * RMRK listener storage provider to save latest block
 */
class StorageProvider implements IStorageProvider {
  readonly storageKey: string = "latestBlock";
  public latestBlock = 0;

  constructor(storageKey = "latestBlock", blockNum = 0) {
    this.storageKey = storageKey;
    this.latestBlock = blockNum;
  }

  public set = async (latestBlock: number) => {
    this.latestBlock = latestBlock;
  };

  public get = async () => {
    return this.latestBlock;
  };
}

const runListener = async () => {
  const api = await getApi("wss://kusama-rpc.polkadot.io");
  const consolidateFunction = async (remarks: Remark[]) => {
    const consolidator = new Consolidator();
    return await consolidator.consolidate(remarks);
  };
  const latestBlock = await getLatestFinalizedBlock(api);
  const storageProvider = new StorageProvider("latestBlock", latestBlock);

  const listener = new RemarkListener({
    polkadotApi: api,
    prefixes: ["0x726d726b", "0x524d524b"],
    consolidateFunction,
    storageProvider,
    loggerEnabled: true
  });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));
  const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
  unfinilisedSubscriber.subscribe((val) =>
    console.log("Unfinalised remarks:", val)
  );
};

runListener();
