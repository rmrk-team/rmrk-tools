import * as fs from "fs";
import { Remark } from "../remark";
import { getRemarksFromBlocks } from "../../utils";

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
  constructor(filePath: string) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const rawdata = fs.readFileSync(filePath);
    this.inputData = JSON.parse(rawdata.toString());
    //console.log(this.inputData);
    console.log(`Loaded ${this.inputData.length} blocks with remark calls`);
  }

  public getInputDataRaw(): JsonRow[] {
    return this.inputData;
  }

  public getRemarks(): Remark[] {
    return getRemarksFromBlocks(this.inputData);
  }
}

type Call = {
  call: string;
  value: string;
  caller: string;
};

type JsonRow = {
  block: number;
  calls: Call[];
};
