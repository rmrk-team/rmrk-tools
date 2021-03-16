import fetch from "node-fetch";
import {
  Block,
  getBlockCallsFromSignedBlock,
  getLatestFinalizedBlock,
  getRemarksFromBlocks,
} from "./tools/utils";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { ApiPromise } from "@polkadot/api";
import fetchRemarks from "./tools/fetchRemarks";
import { Observable, Subscriber } from "rxjs";
import { RpcPromiseResult } from "@polkadot/api/types";
import { Header } from "@polkadot/types/interfaces/runtime";
import { BlockCalls } from "./tools/types";
import { Consolidator } from "./tools/consolidator/consolidator";

interface IProps {
  providerInterface: ProviderInterface;
  prefixes?: string[];
  initialBlockCalls?: BlockCalls[];
  initialRemarksUrl?: string;
}

export class RemarkListener {
  private initialRemarksUrl?: string;
  private providerInterface: ProviderInterface;
  private apiPromise: Promise<ApiPromise>;
  private initialBlockCalls: BlockCalls[];
  private missingBlockCalls: BlockCalls[];
  private latestBlockCalls: BlockCalls[];
  private latestBlockCallsFinalised: BlockCalls[];
  private observer: Subscriber<unknown> | null;
  private observerUnfinalised: Subscriber<unknown> | null;
  private initialised: boolean;
  private prefixes: string[];

  constructor({
    providerInterface,
    prefixes,
    initialBlockCalls,
    initialRemarksUrl,
  }: IProps) {
    if (!providerInterface) {
      throw new Error(
        `"providerInterface" is missing. Please provide polkadot.js provider interface (i.e. websocket)`
      );
    }
    if (!initialRemarksUrl && !initialBlockCalls) {
      throw new Error(
        `"initialRemarksUrl" or "initialBlockCalls" are missing. Please provide url to your remarks dump or pre-fetched block calls.`
      );
    }
    this.initialRemarksUrl = initialRemarksUrl;
    this.providerInterface = providerInterface;
    this.apiPromise = ApiPromise.create({ provider: this.providerInterface });

    this.initialBlockCalls = initialBlockCalls || [];
    this.missingBlockCalls = [];
    this.latestBlockCalls = [];
    this.latestBlockCallsFinalised = [];
    this.observer = null;
    this.observerUnfinalised = null;
    this.initialised = false;
    this.prefixes = prefixes || [];
  }

  private getLastBlockNumber = (blocks: Block[]): number => {
    const lastBlock = blocks[blocks.length - 1];
    return lastBlock.block;
  };

  private initialize = async () => {
    if (!this.initialised) {
      this.initialised = true;
      // Subscribe to latest head blocks (unfinalised)
      await this.initialiseListener({ finalised: false });
      // Subscribe to latest head blocks (finalised)
      await this.initialiseListener({ finalised: true });
      // Fetch latest remark blocks from dump if missing
      if (this.initialBlockCalls.length < 1) {
        this.initialBlockCalls = await this.fetchInitialRemarks();
      }
      // Fetch latest remark blocks since last block in the dump above
      this.missingBlockCalls = await this.fetchMissingBlockCalls(
        this.initialBlockCalls
      );

      this.consolidate();
    }
  };

  /* Rxjs observable for finalised remarks, this will return all of consolidated remarks */
  public initialiseObservable = (): Observable<unknown> => {
    const subscriber = new Observable((observer) => {
      this.observer = observer;
    });
    this.initialize();
    return subscriber;
  };

  /*
   Rxjs observable for un-finalised remarks, this will return remarks that are only present in latest block
   This listener fires again when blocks are removed if they are present in finalised block
  */
  public initialiseObservableUnfinalised = (): Observable<unknown> => {
    const subscriber = new Observable((observer) => {
      this.observerUnfinalised = observer;
    });
    this.initialize();
    return subscriber;
  };

  /*
   Fetch initial remarks from provided dump url
   */
  public async fetchInitialRemarks(): Promise<Block[] | []> {
    try {
      if (!this.initialRemarksUrl) {
        throw new Error(
          `"initialRemarksUrl" is missing. Please provide url to your remarks dump`
        );
      }
      const response = await fetch(this.initialRemarksUrl);
      if (response.status === 200) {
        const initialRemarks = await response.json();
        return initialRemarks;
      }
      return [];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /*
   Fetch blocks between last block in dump and last block on chain
   */
  public async fetchMissingBlockCalls(
    initialBlocks: Block[]
  ): Promise<Block[]> {
    try {
      const api = await this.apiPromise;
      const from = await this.getLastBlockNumber(initialBlocks);
      const to = await getLatestFinalizedBlock(api);
      const missingBlocks = await fetchRemarks(api, from, to, this.prefixes);
      return missingBlocks;
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
    const api = await this.apiPromise;
    return api.rpc.chain.subscribeNewHeads;
  }

  /*
    returns polkadot api latest unfinalised block head listener
  */
  private async getFinalisedHeadSubscrber(): Promise<
    RpcPromiseResult<() => Observable<Header>>
  > {
    const api = await this.apiPromise;
    return api.rpc.chain.subscribeFinalizedHeads;
  }

  /*
    Consolidates remarks and firs listeners
  */
  private consolidate = () => {
    // Join dump blocks and missing blocks (since dump)
    const concatinatedBlockCallsBase = [
      ...this.initialBlockCalls,
      ...this.missingBlockCalls,
    ];

    // Only consolidate and fire event if user subscribed to finalised blocks listener
    if (this.observer) {
      const consolidator = new Consolidator();
      // Consolidate all historical blocks and new blocks received from polkadot api
      const remarks = getRemarksFromBlocks([
        ...concatinatedBlockCallsBase,
        ...this.latestBlockCallsFinalised,
      ]);
      const consolidatedFinal = consolidator.consolidate(remarks);
      // Fire event to a subscriber
      this.observer.next(consolidatedFinal);
    }

    // Only consolidate and fire event if user subscribed to UN-finalised blocks listener
    if (this.observerUnfinalised) {
      const consolidator = new Consolidator();
      // Only extract and consolidate remarks from unfinalised block, no need to consolidate whole thing here
      // User can then decide what to do with them
      const remarks = getRemarksFromBlocks(this.latestBlockCalls);
      const consolidatedFinal = consolidator.consolidate(remarks);
      // Fire event to a subscriber
      this.observerUnfinalised.next(consolidatedFinal);
    }
  };

  /*
    Subscribe to latest block heads, (finalised, and un-finalised)
    Save them to 2 separate arrays, and once block is finalised, remove it from unfinalised array
    this.latestBlockCalls is array of unfinalised blocks,
    we keep it for reference incase consumer wants to disable remarks that are being interacted with
   */
  private async initialiseListener({ finalised }: { finalised: boolean }) {
    const headSubscriber = finalised
      ? await this.getFinalisedHeadSubscrber()
      : await this.getHeadSubscrber();

    headSubscriber(async (header) => {
      console.log(`Chain is at block: #${header.number}`);
      if (header.number.toNumber() === 0) {
        console.error(
          "Unable to retrieve finalized head - returned genesis block"
        );
      }
      const api = await this.apiPromise;
      const blockHash = await api.rpc.chain.getBlockHash(
        header.number.toNumber()
      );
      const block = await api.rpc.chain.getBlock(blockHash);
      const calls = await getBlockCallsFromSignedBlock(
        block,
        this.prefixes,
        api
      );
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
          this.consolidate();
        } else {
          this.latestBlockCalls.push(blockCalls);

          /* If someone is listening to unfinalised blocks, return them here */
          if (this.observerUnfinalised) {
            const consolidator = new Consolidator();
            // Only extract and consolidate remarks from unfinalised block, no need to consolidate whole thing here
            // User can then decide what to do with them
            const remarks = getRemarksFromBlocks(this.latestBlockCalls);
            const consolidatedFinal = consolidator.consolidate(remarks);
            // Fire event to a subscriber
            this.observerUnfinalised.next(consolidatedFinal);
          }
        }
      }
    });

    return;
  }
}
