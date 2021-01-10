import JsonAdapter from "./adapters/json";
import * as fs from "fs";

export default class Consolidator {
  private adapter: JsonAdapter;
  constructor(initializedAdapter: JsonAdapter) {
    this.adapter = initializedAdapter;
  }

  public consolidate(): void {
    const remarks = this.adapter.getRemarks();
    for (const remark of remarks) {
      console.log(remark);
    }
  }
}
