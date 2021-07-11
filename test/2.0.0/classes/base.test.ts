import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createNftClassMock, createBaseMock } from "../mocks";

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
