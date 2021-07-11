import { createNftClassMock } from "../mocks";
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

describe("rmrk2.0.0 NftClass: Create", () => {
  it("should throw error", async () => {
    const nftClass = createNftClassMock(1);
    try {
      await nftClass.create();
    } catch (e) {
      expect(e.message).toMatch(
        "An already existing nft class cannot be created!"
      );
    }
  });
});

describe("rmrk2.0.0 NftClass: Get changes", () => {
  it("should match snapshot", async () => {
    const nftClass = createNftClassMock();
    expect(await nftClass.getChanges()).toMatchSnapshot();
  });
});
