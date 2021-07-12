import { Consolidator } from "../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
} from "./mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: CREATE NFT CLASS", () => {
  it("should correctly create a NFT Collection", async () => {
    const remarks = getRemarksFromBlocksMock(
      getBlockCallsMock(createCollectionMock().create())
    );
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
