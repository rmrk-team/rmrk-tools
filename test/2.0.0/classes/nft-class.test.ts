import { createNftClassMock, addChangeIssuerMock, getBobKey } from "../mocks";
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

describe("rmrk2.0.0 NftClass: Change issuer", () => {
  it("should match snapshot", async () => {
    const nftClass = createNftClassMock(1);
    expect(await nftClass.change_issuer(getBobKey().address)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 NftClass: Create", () => {
  it("should throw error", async () => {
    const nftClass = createNftClassMock(0);
    try {
      await nftClass.change_issuer(getBobKey().address);
    } catch (e) {
      expect(e.message).toMatch(
        "This nft class is new, so there's no issuer to change. If it has been deployed on chain, load the existing nft class as a new instance first, then change issuer."
      );
    }
  });
});

describe("rmrk2.0.0 NftClass: Add change", () => {
  it("should match snapshot", async () => {
    const nftClass = createNftClassMock();
    expect(await nftClass.addChange(addChangeIssuerMock)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 NftClass: Get changes", () => {
  it("should match snapshot", async () => {
    const nftClass = createNftClassMock();
    await nftClass.addChange(addChangeIssuerMock);
    expect(await nftClass.getChanges()).toMatchSnapshot();
  });
});
