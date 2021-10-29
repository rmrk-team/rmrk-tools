import * as fs from "fs";
import { Remark } from "../remark";
import { filterBlocksByCollection, getRemarksFromBlocks } from "../../utils";
import { BlockCall, BlockCalls } from "../../types";

/**
 * The JSON adapter expects to find a JSON array with elements
 * adhering to the following format in the provided filepath:
 *
{
  block: 5437981,
  calls: [
    {
      call: 'system.remark',
      value: '0x726d726b3a3a53454e443a...633350444e4336706533',
      caller: 'DmUVjSi8id22vcH26btyVsVq39p8EVPiepdBEYhzoLL8Qby'
    }
  ]
}
 */
export default class JsonAdapter {
  private inputData: JsonRow[];
  private collectionFilter?: string;
  private prefixes: string[];

  constructor(
    filePath: string,
    prefixes: string[],
    collectionFilter?: string,
    toBlock?: number
  ) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const rawdata = fs.readFileSync(filePath);

    let data = JSON.parse(rawdata.toString());
    if (toBlock) {
      data = data.filter((obj: BlockCalls) => obj.block <= Number(toBlock));
      console.log(`Take blocks to: ${toBlock}`);
    }
    this.inputData = data;
    this.collectionFilter = collectionFilter;
    this.prefixes = prefixes;
    //console.log(this.inputData);
    console.log(`Loaded ${this.inputData.length} blocks with remark calls`);
  }

  public getInputDataRaw(): JsonRow[] {
    return this.inputData;
  }

  public getRemarks(): Remark[] {
    let blocks = this.inputData;
    if (this.collectionFilter) {
      blocks = filterBlocksByCollection(
        blocks,
        this.collectionFilter,
        this.prefixes
      );
    }
    return getRemarksFromBlocks(blocks, this.prefixes);
  }

  public getLastBlock(): number {
    const blocks = this.inputData;
    const lastBlock = blocks[blocks.length - 1];
    return lastBlock.block || 0;
  }
}

type JsonRow = {
  block: number;
  calls: BlockCall[];
};
