import "isomorphic-fetch";
import { ApiPromise } from "@polkadot/api";
import { Observable, Subscriber } from "rxjs";
import { RpcPromiseResult } from "@polkadot/api/types";
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

interface IProps {
  polkadotApi: ApiPromise | null;
  prefixes?: string[];
  initialBlockCalls?: BlockCalls[];
  initialRemarksUrl?: string;
  consolidateFunction: (remarks: Remark[]) => Promise<ConsolidatorReturnType>;
  storageProvider?: IStorageProvider;
  storageKey?: string;
}

interface IStorageProvider {
  readonly storageKey: string;
  set(latestBlock: number): Promise<void>;
  get(): Promise<string | null>;
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
    return localStorage.getItem(this.storageKey);
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
  public strageProvider: IStorageProvider;
  private consolidateFunction: (
    remarks: Remark[]
  ) => Promise<ConsolidatorReturnType>;

  constructor({
    polkadotApi,
    prefixes,
    consolidateFunction,
    storageProvider,
    storageKey,
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
    this.strageProvider =
      storageProvider || new LocalStorageProvider(storageKey);
  }

  private initialize = async (latestBlock: number) => {
    if (!this.initialised) {
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

  /* Rxjs observable for finalised remarks, this will return all of consolidated remarks */
  public initialiseObservable = (
    latestBlock = 0
  ): Observable<ConsolidatorReturnType> => {
    const subscriber = new Observable<ConsolidatorReturnType>((observer) => {
      this.observer = observer;
    });
    this.initialize(latestBlock);
    return subscriber;
  };

  /*
   Rxjs observable for un-finalised remarks, this will return remarks that are only present in latest block
   This listener fires again when blocks are removed if they are present in finalised block
  */
  public initialiseObservableUnfinalised = (
    latestBlock = 0
  ): Observable<Remark[]> => {
    const subscriber = new Observable<Remark[]>((observer) => {
      this.observerUnfinalised = observer;
    });
    this.initialize(latestBlock);
    return subscriber;
  };

  /*
   Fetch blocks between last block in dump and last block on chain
   */
  public async fetchMissingBlockCalls(latestBlock: number): Promise<Block[]> {
    try {
      const to = await getLatestFinalizedBlock(this.apiPromise);
      return await fetchRemarks(
        this.apiPromise,
        latestBlock + 1,
        to,
        this.prefixes
      );
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /*
    returns polkadot api latest block head listener
  */
  private async getHeadSubscrber(): Promise<
    RpcPromiseResult<() => Observable<Header>>
  > {
    return this.apiPromise.rpc.chain.subscribeNewHeads;
  }

  /*
    returns polkadot api latest unfinalised block head listener
  */
  private async getFinalisedHeadSubscrber(): Promise<
    RpcPromiseResult<() => Observable<Header>>
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

      const remarks = getRemarksFromBlocks(blockCalls, this.prefixes);
      this.latestBlockCallsFinalised = [];
      this.missingBlockCalls = [];
      await this.strageProvider.set(this.currentBlockNum);
      const consolidatedFinal = await this.consolidateFunction(remarks);
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
      if (finalised) {
        this.currentBlockNum = header.number.toNumber();
      }

      // Update local db latestBlock
      if (this.missingBlockCallsFetched && finalised && calls.length === 0) {
        try {
          await this.strageProvider.set(header.number.toNumber());
        } catch (e) {
          console.error(e);
        }
      }

      if (calls.length > 0) {
        const blockCalls: BlockCalls = {
          block: header.number.toNumber(),
          calls,
        };

        // If we are listening to finalised blocks
        if (finalised) {
          this.latestBlockCallsFinalised.push(blockCalls);
          // Now that block has been finalised,
          // remove remarks that we found in it from unfinalised blockCalls array that we keep in memory
          this.latestBlockCalls = this.latestBlockCalls.filter(
            (item) => item?.block !== blockCalls.block
          );
          // Call consolidate to re-consolidate and fire subscription event back to subscriber
          await this.consolidate();
        } else {
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
