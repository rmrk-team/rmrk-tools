import { cryptoWaitReady } from "@polkadot/util-crypto";
import { addChangeIssuerMock, mintNftMock } from "../mocks";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Nft: Get id", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.getId()).toMatchSnapshot();
  });
});

describe("rmrk2.0.0  Nft: Get id", () => {
  it("should throw error", async () => {
    const nft = mintNftMock();
    try {
      await nft.getId();
    } catch (e) {
      expect(e.message).toMatch(
        "This token is not minted, so it cannot have an ID."
      );
    }
  });
});

describe("rmrk2.0.0 Collection: Add change", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock();
    expect(await nft.addChange(addChangeIssuerMock)).toMatchSnapshot();
  });
});
