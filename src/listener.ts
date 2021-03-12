import fetch from "node-fetch";
import {
  Block,
  getBlockCallsFromSignedBlock,
  getLatestFinalizedBlock,
} from "./tools/utils";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { ApiPromise } from "@polkadot/api";
import fetchRemarks from "./tools/fetchRemarks";
import { Observable } from "rxjs";
import { RpcPromiseResult } from "@polkadot/api/types";
import { Header } from "@polkadot/types/interfaces/runtime";
import { BlockCalls } from "./tools/types";

const DEFAULT_GATEWAY =
  "https://gateway.pinata.cloud/ipfs/QmNSkd7e5ShjpvqJUGjub1fD6Tg2g3YqDBdgnkC3jgCjCR";

export class RemarkListener {
  private initialRemarksUrl: string;
  private providerInterface: ProviderInterface;
  private apiPromise: Promise<ApiPromise>;
  private initialBlockCalls: BlockCalls[];
  private missingCallBlocks: BlockCalls[];
  private latestCallBlocks: BlockCalls[];

  constructor(
    providerInterface: ProviderInterface,
    initialRemarksUrl?: string
  ) {
    this.initialRemarksUrl = initialRemarksUrl || DEFAULT_GATEWAY;
    this.providerInterface = providerInterface;
    this.apiPromise = ApiPromise.create({ provider: this.providerInterface });

    this.initialBlockCalls = [];
    this.missingCallBlocks = [];
    this.latestCallBlocks = [];
  }

  private getLastBlockNumber = (blocks: Block[]): number => {
    const lastBlock = blocks[blocks.length - 1];
    return lastBlock.block;
  };

  public initialize = async () => {
    await this.initialiseListener();
    this.initialBlockCalls = await this.fetchInitialRemarks();
    this.missingCallBlocks = await this.fetchMissingCallBlocks(
      this.initialBlockCalls
    );
  };

  public async fetchInitialRemarks(): Promise<Block[] | []> {
    try {
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

  public async fetchMissingCallBlocks(
    initialBlocks: Block[]
  ): Promise<Block[]> {
    try {
      const api = await this.apiPromise;
      const from = await this.getLastBlockNumber(initialBlocks);
      const to = await getLatestFinalizedBlock(api);
      const missingBlocks = await fetchRemarks(api, from, to, []);
      return missingBlocks;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async getHeadSubscrber(): Promise<
    RpcPromiseResult<() => Observable<Header>>
  > {
    const api = await this.apiPromise;
    return api.rpc.chain.subscribeNewHeads;
  }

  public async initialiseListener() {
    const headSubscriber = await this.getHeadSubscrber();
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
      const blockCall = await getBlockCallsFromSignedBlock(block, [], api);
      if (blockCall.length > 0) {
        const blockCalls: BlockCalls = {
          block: header.number.toNumber(),
          calls: blockCall,
        };
        this.latestCallBlocks.push(blockCalls);
      }
    });
  }
}
