import { Remark } from "../remark";
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
    private inputData;
    constructor(filePath: string);
    getInputDataRaw(): JsonRow[];
    getRemarks(): Remark[];
}
declare type JsonRow = {
    block: number;
    calls: Call[];
};
declare type Call = {
    call: string;
    value: string;
    caller: string;
};
export {};
