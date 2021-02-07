import * as fs from "fs";
import { Remark } from "../remark";
import { hexToString } from "@polkadot/util";

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
    const remarks: Remark[] = [];
    for (const row of this.inputData) {
      for (const call of row.calls) {
        if (call.call !== "system.remark") continue;
        const meta = getMeta(call, row.block);
        if (!meta) continue;
        let remark;
        switch (meta.type) {
          case "MINTNFT":
          case "MINT":
            remark = decodeURI(hexToString(call.value));
            break;
          default:
            remark = hexToString(call.value);
            break;
        }
        const r: Remark = {
          block: row.block,
          caller: call.caller,
          interaction_type: meta.type,
          version: meta.version,
          remark: remark,
        };
        remarks.push(r);
      }
    }
    return remarks;
  }
}

function getMeta(call: Call, block: number): RemarkMeta | false {
  const str = hexToString(call.value);
  const arr = str.split("::");
  if (arr.length < 3) {
    console.error(`Invalid RMRK in block ${block}: ${str}`);
    return false;
  }
  return {
    type: arr[1],
    version: parseFloat(arr[2]) ? arr[2] : "0.1",
  } as RemarkMeta;
}

type JsonRow = {
  block: number;
  calls: Call[];
};

type Call = {
  call: string;
  value: string;
  caller: string;
};

type RemarkMeta = {
  type: string;
  version: string;
};
