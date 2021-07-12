import { createCollectionMock, addChangeIssuerMock, getBobKey } from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Collection: Create", () => {
  it("should match snapshot", async () => {
    const collection = createCollectionMock();
    expect(await collection.create()).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Collection: Create", () => {
  it("should throw error", async () => {
    const collection = createCollectionMock(1);
    try {
      await collection.create();
    } catch (e) {
      expect(e.message).toMatch(
        "An already existing collection cannot be created!"
      );
    }
  });
});

describe("rmrk2.0.0 Collection: Change issuer", () => {
  it("should match snapshot", async () => {
    const collection = createCollectionMock(1);
    expect(await collection.change_issuer(getBobKey().address)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Collection: Create", () => {
  it("should throw error", async () => {
    const collection = createCollectionMock(0);
    try {
      await collection.change_issuer(getBobKey().address);
    } catch (e) {
      expect(e.message).toMatch(
        "This collection is new, so there's no issuer to change. If it has been deployed on chain, load the existing collection as a new instance first, then change issuer."
      );
    }
  });
});

describe("rmrk2.0.0 Collection: Add change", () => {
  it("should match snapshot", async () => {
    const collection = createCollectionMock();
    expect(await collection.addChange(addChangeIssuerMock)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Collection: Get changes", () => {
  it("should match snapshot", async () => {
    const collection = createCollectionMock();
    await collection.addChange(addChangeIssuerMock);
    expect(await collection.getChanges()).toMatchSnapshot();
  });
});
