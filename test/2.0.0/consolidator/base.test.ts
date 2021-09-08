import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createBaseMock,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: CREATE BASE", () => {
  it("should correctly create a Base", async () => {
    const remarks = getRemarksFromBlocksMock(
      getBlockCallsMock(createBaseMock().base())
    );
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
