import { Consolidator } from "../../src/rmrk2.0.0";
import {
  createNftClassMock,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
} from "./mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: CREATE NFT CLASS", () => {
  it("should correctly create a NFT Class", async () => {
    const remarks = getRemarksFromBlocksMock(
      getBlockCallsMock(createNftClassMock().create())
    );
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
