import "isomorphic-fetch";
import { ApiPromise } from "@polkadot/api";
import { Observable, Subscriber } from "rxjs";
import { Header } from "@polkadot/types/interfaces/runtime";
import { BlockCalls } from "./tools/types";
import {
  Block,
  getBlockCallsFromSignedBlock,
  getLatestFinalizedBlock,
  getRemarksFromBlocks,
} from "./tools/utils";

import { Remark } from "./tools/consolidator/remark";
import { ConsolidatorReturnType } from "./tools/consolidator/consolidator";
import fetchRemarks from "./tools/fetchRemarks";
import { hexToString } from "@polkadot/util";
import { VERSION } from "./tools/constants";
import { PromiseRpcResult } from "@polkadot/api-base/types/rpc";

interface IProps {
  polkadotApi: ApiPromise | null;
  prefixes?: string[];
  initialBlockCalls?: BlockCalls[];
  initialRemarksUrl?: string;
  consolidateFunction: (remarks: Remark[]) => Promise<ConsolidatorReturnType>;
  storageProvider?: IStorageProvider;
  storageKey?: string;
  loggerEnabled?: boolean;
}

export interface IStorageProvider {
  readonly storageKey: string;
  set(latestBlock: number): Promise<void>;
  get(): Promise<number>;
}

class LocalStorageProvider implements IStorageProvider {
  readonly storageKey: string;

  constructor(storageKey?: string) {
    this.storageKey = storageKey || "latestBlock";
  }

  public set = async (latestBlock: number) => {
    localStorage.setItem(this.storageKey, String(latestBlock));
  };

  public get = async () => {
    const latestBlockString = localStorage.getItem(this.storageKey);
    return latestBlockString ? parseInt(latestBlockString) : 0;
  };
}

export class RemarkListener {
  private apiPromise: ApiPromise;
  private missingBlockCalls: BlockCalls[];
  private latestBlockCalls: BlockCalls[];
  private latestBlockCallsFinalised: BlockCalls[];
  private observer: Subscriber<unknown> | null;
  private observerUnfinalised: Subscriber<unknown> | null;
  private initialised: boolean;
  private missingBlockCallsFetched: boolean;
  private prefixes: string[];
  private currentBlockNum: number;
  private loggerEnabled: boolean;
  public storageProvider: IStorageProvider;
  private consolidateFunction: (
    remarks: Remark[]
  ) => Promise<ConsolidatorReturnType>;

  constructor({
    polkadotApi,
    prefixes,
    consolidateFunction,
    storageProvider,
    storageKey,
    loggerEnabled = false,
  }: IProps) {
    if (!polkadotApi) {
      throw new Error(
        `"providerInterface" is missing. Please provide polkadot.js provider interface (i.e. websocket)`
      );
    }
    this.currentBlockNum = 0;
    this.apiPromise = polkadotApi;
    this.missingBlockCalls = [];
    this.latestBlockCalls = [];
    this.latestBlockCallsFinalised = [];
    this.observer = null;
    this.observerUnfinalised = null;
    this.initialised = false;
    this.missingBlockCallsFetched = false;
    this.prefixes = prefixes || [];
    this.consolidateFunction = consolidateFunction;
    this.storageProvider =
      storageProvider || new LocalStorageProvider(storageKey);
    this.loggerEnabled = loggerEnabled;
  }

  private initialize = async () => {
    if (!this.initialised) {
      const latestBlock = await this.storageProvider.get();
      this.initialised = true;
      // Subscribe to latest head blocks (unfinalised)
      await this.initialiseListener({ finalised: false });
      // Subscribe to latest head blocks (finalised)
      await this.initialiseListener({ finalised: true });
      // Fetch latest remark blocks since last block in the db
      this.missingBlockCalls = await this.fetchMissingBlockCalls(latestBlock);
      this.missingBlockCallsFetched = true;
      this.consolidate();
    }
  };

  private logger = (message: string) => {
    if (this.loggerEnabled) {
      console.log(message);
    }
  };

  /* Rxjs observable for finalised remarks, this will return all of consolidated remarks */
  public initialiseObservable = (): Observable<ConsolidatorReturnType> => {
    const subscriber = new Observable<ConsolidatorReturnType>((observer) => {
      this.observer = observer;
    });
    this.initialize();
    return subscriber;
  };

  /*
   Rxjs observable for un-finalised remarks, this will return remarks that are only present in latest block
   This listener fires again when blocks are removed if they are present in finalised block
  */
  public initialiseObservableUnfinalised = (): Observable<Remark[]> => {
    const subscriber = new Observable<Remark[]>((observer) => {
      this.observerUnfinalised = observer;
    });
    this.initialize();
    return subscriber;
  };

  /*
   Fetch blocks between last block in dump and last block on chain
   */
  public async fetchMissingBlockCalls(
    latestBlock: number,
    toBlock?: number
  ): Promise<Block[]> {
    try {
      const to = toBlock || (await getLatestFinalizedBlock(this.apiPromise));

      this.logger(
        `Fetching missing or skipped blocks between ${
          latestBlock + 1
        } and ${to}`
      );
      const remarks = await fetchRemarks(
        this.apiPromise,
        latestBlock + 1,
        to,
        this.prefixes
      );
      this.logger(`Found ${remarks.length} remarks`);
      return remarks;
    } catch (error: any) {
      console.log(error);
      return [];
    }
  }

  /*
    returns polkadot api latest block head listener
  */
  private async getHeadSubscrber(): Promise<
    PromiseRpcResult<() => Observable<Header>>
  > {
    return this.apiPromise.rpc.chain.subscribeNewHeads;
  }

  /*
    returns polkadot api latest unfinalised block head listener
  */
  private async getFinalisedHeadSubscrber(): Promise<
    PromiseRpcResult<() => Observable<Header>>
  > {
    return this.apiPromise.rpc.chain.subscribeFinalizedHeads;
  }

  /*
    Consolidates remarks and firs listeners
  */
  private consolidate = async () => {
    // Join dump blocks and missing blocks (since dump)
    // Only consolidate and fire event if user subscribed to finalised blocks listener
    if (this.observer && this.missingBlockCallsFetched) {
      // Consolidate all historical blocks and new blocks received from polkadot api
      const blockCalls = [
        ...this.missingBlockCalls,
        ...this.latestBlockCallsFinalised,
      ];

      // Logging
      if (blockCalls.length > 0 && this.loggerEnabled) {
        const blockNums = blockCalls.map((blockCall) => blockCall.block);
        this.logger(
          `Consolidating block range between: ${blockNums[0]} and ${
            blockNums[blockNums.length - 1]
          }`
        );
      }

      const remarks = getRemarksFromBlocks(blockCalls, this.prefixes);
      this.latestBlockCallsFinalised = [];
      this.missingBlockCalls = [];
      const consolidatedFinal = await this.consolidateFunction(remarks);
      await this.storageProvider.set(this.currentBlockNum);
      // Fire event to a subscriber
      this.observer.next(consolidatedFinal);
    }

    if (this.observerUnfinalised) {
      const remarks = getRemarksFromBlocks(
        [...this.missingBlockCalls, ...this.latestBlockCalls],
        this.prefixes
      );
      // Fire event to a subscriber
      this.observerUnfinalised.next(remarks);
    }
  };

  /*
    Subscribe to latest block heads, (finalised, and un-finalised)
    Save them to 2 separate arrays, and once block is finalised, remove it from unfinalised array
    this.latestBlockCalls is array of unfinalised blocks,
    we keep it for reference in case consumer wants to disable remarks that are being interacted with
   */
  private async initialiseListener({ finalised }: { finalised: boolean }) {
    const headSubscriber = finalised
      ? await this.getFinalisedHeadSubscrber()
      : await this.getHeadSubscrber();

    headSubscriber(async (header) => {
      if (header.number.toNumber() === 0) {
        console.error(
          "Unable to retrieve finalized head - returned genesis block"
        );
      }
      const blockHash = await this.apiPromise.rpc.chain.getBlockHash(
        header.number.toNumber()
      );
      const block = await this.apiPromise.rpc.chain.getBlock(blockHash);
      const calls = await getBlockCallsFromSignedBlock(
        block,
        this.prefixes,
        this.apiPromise
      );
      const filteredCalls = calls.filter((call) => {
        return hexToString(call.value).includes(`::${VERSION}::`);
      });

      const latestFinalisedBlockNum = header.number.toNumber();

      if (finalised) {
        const latestSavedBlock = this.currentBlockNum;
        // Compare block sequence order to see if there's a skipped finalised block
        if (
          latestSavedBlock &&
          latestSavedBlock + 1 < latestFinalisedBlockNum &&
          this.missingBlockCallsFetched
        ) {
          // Fetch all the missing blocks and save their remarks for next consolidation.
          this.missingBlockCallsFetched = false;
          this.missingBlockCalls = await this.fetchMissingBlockCalls(
            latestSavedBlock,
            latestFinalisedBlockNum - 1
          );
          this.missingBlockCallsFetched = true;
        }
        this.currentBlockNum = latestFinalisedBlockNum;
      }

      // Update local db latestBlock
      if (
        this.missingBlockCallsFetched &&
        finalised &&
        filteredCalls.length === 0
      ) {
        try {
          await this.storageProvider.set(latestFinalisedBlockNum);
        } catch (e: any) {
          console.error(e);
        }
      }

      if (filteredCalls.length < 1 && this.missingBlockCalls.length > 0) {
        await this.consolidate();
      }

      if (filteredCalls.length > 0) {
        const blockCalls: BlockCalls = {
          block: latestFinalisedBlockNum,
          calls: filteredCalls,
        };

        // If we are listening to finalised blocks
        if (finalised) {
          this.latestBlockCallsFinalised.push(blockCalls);
          // Now that block has been finalised,
          // remove remarks that we found in it from unfinalised blockCalls array that we keep in memory or stalled blocks (more than 10 blocks)
          this.latestBlockCalls = this.latestBlockCalls.filter(
            (item) =>
              item?.block !== blockCalls.block ||
              blockCalls.block - item.block > 20
          );
          // Call consolidate to re-consolidate and fire subscription event back to subscriber
          await this.consolidate();
        } else {
          // Filter stalled blocks (20 blocks) to free up memory
          this.latestBlockCalls = this.latestBlockCalls.filter(
            (item) => blockCalls.block - item.block > 20
          );
          this.latestBlockCalls.push(blockCalls);
          /* If someone is listening to unfinalised blocks, return them here */
          if (this.observerUnfinalised) {
            const remarks = getRemarksFromBlocks(
              [...this.latestBlockCalls],
              this.prefixes
            );
            this.observerUnfinalised.next(remarks);
          }
        }
      }
    });

    return;
  }
}
