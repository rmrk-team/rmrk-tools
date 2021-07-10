import { createNftClassMock } from "./mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 NftClass: Create", () => {
  it("should match snapshot", async () => {
    const nftClass = createNftClassMock();
    expect(await nftClass.create()).toMatchSnapshot();
  });
});
