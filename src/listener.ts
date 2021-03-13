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

import defaultDump from "../dumps/remarks-4892957-6588851-0x726d726b,0x524d524b.json";

interface IProps {
  providerInterface: ProviderInterface;
  prefixes?: string[];
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
  private prefixes: string[];

  constructor({ providerInterface, prefixes, initialRemarksUrl }: IProps) {
    this.initialRemarksUrl = initialRemarksUrl;
    this.providerInterface = providerInterface;
    this.apiPromise = ApiPromise.create({ provider: this.providerInterface });

    this.initialBlockCalls = [];
    this.missingBlockCalls = [];
    this.latestBlockCalls = [];
    this.latestBlockCallsFinalised = [];
    this.observer = null;
    this.prefixes = prefixes || [];
  }

  private getLastBlockNumber = (blocks: Block[]): number => {
    const lastBlock = blocks[blocks.length - 1];
    return lastBlock.block;
  };

  private initialize = async () => {
    // Subscribe to latest head blocks (unfinalised)
    await this.initialiseListener(false);
    // Subscribe to latest head blocks (finalised)
    await this.initialiseListener(true);
    // Fetch latest remark blocks from dump
    this.initialBlockCalls = await this.fetchInitialRemarks();
    // Fetch latest remark blocks since last block in the dump above
    this.missingBlockCalls = await this.fetchMissingBlockCalls(
      this.initialBlockCalls
    );

    this.consolidate();
  };

  public initialiseObservable = (): Observable<unknown> => {
    const subscriber = new Observable((observer) => {
      this.observer = observer;
    });
    this.initialize();
    return subscriber;
  };

  public async fetchInitialRemarks(): Promise<Block[] | []> {
    try {
      if (!this.initialRemarksUrl) {
        return defaultDump;
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

  public async fetchMissingBlockCalls(
    initialBlocks: Block[]
  ): Promise<Block[]> {
    try {
      const api = await this.apiPromise;
      const from = await this.getLastBlockNumber(initialBlocks);
      const to = await getLatestFinalizedBlock(api);
      console.log(from, to);
      const missingBlocks = await fetchRemarks(api, from, to, this.prefixes);
      return missingBlocks;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getHeadSubscrber(): Promise<
    RpcPromiseResult<() => Observable<Header>>
  > {
    const api = await this.apiPromise;
    return api.rpc.chain.subscribeNewHeads;
  }

  private async getFinalisedHeadSubscrber(): Promise<
    RpcPromiseResult<() => Observable<Header>>
  > {
    const api = await this.apiPromise;
    return api.rpc.chain.subscribeFinalizedHeads;
  }

  private consolidate = () => {
    const concatinatedBlockCalls = [
      ...this.initialBlockCalls,
      ...this.missingBlockCalls,
      ...this.latestBlockCallsFinalised,
    ];
    const remarks = getRemarksFromBlocks(concatinatedBlockCalls);
    const consolidator = new Consolidator();
    const consolidatedFinal = consolidator.consolidate(remarks);
    if (this.observer) {
      this.observer.next(consolidatedFinal);
    }
  };

  /*
    Subscribe to latest block heads, (finalised, and un-finalised)
    Save them to 2 separate arrays, and once block is finalised, remove it from unfinalised array
    this.latestBlockCalls is array of unfinalised blocks,
    we keep it for reference incase consumer wants to disable remarks that are being interacted with
   */
  private async initialiseListener(finalised: boolean) {
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
        if (finalised) {
          console.log("FINALISED BLOCK", blockCalls);
          this.latestBlockCallsFinalised.push(blockCalls);

          // Now that block has been finalised, remove it from unfinalised blockCalls array
          this.latestBlockCalls = this.latestBlockCalls.filter(
            (item) => item?.block !== blockCalls.block
          );

          this.consolidate();
        } else {
          console.log("LATEST BLOCK", blockCalls);
          this.latestBlockCalls.push(blockCalls);
        }
      }
    });

    return;
  }
}
