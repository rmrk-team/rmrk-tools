import { cryptoWaitReady } from "@polkadot/util-crypto";
import { getBobKey, createBaseMock, createNftClassMock } from "../mocks";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Base: Base", () => {
  it("should match snapshot", async () => {
    const baseClass = createBaseMock();
    expect(await baseClass.base()).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Base: Base", () => {
  it("should throw error", async () => {
    const baseClass = createBaseMock(1);
    try {
      await baseClass.base();
    } catch (e) {
      expect(e.message).toMatch("An already existing BASE cannot be minted!");
    }
  });
});

describe("rmrk2.0.0 Base: Change issuer", () => {
  it("should match snapshot", async () => {
    const baseClass = createBaseMock(1);
    expect(
      await baseClass.change_issuer(getBobKey().address)
    ).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Base: Base", () => {
  it("should throw error", async () => {
    const baseClass = createBaseMock(0);
    try {
      await baseClass.change_issuer(getBobKey().address);
    } catch (e) {
      expect(e.message).toMatch(
        "This base is new, so there's no issuer to change. If it has been deployed on chain, load the existing nft class as a new instance first, then change issuer."
      );
    }
  });
});
