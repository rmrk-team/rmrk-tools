import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
  getBobKey,
  createBaseMock,
  createNftClassMock,
  addChangeIssuerMock,
} from "../mocks";

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

describe("rmrk2.0.0 Base: Equippable", () => {
  it("should match snapshot", async () => {
    const baseClass = createBaseMock(1);
    expect(
      await baseClass.equippable({
        slot: "gemslot2",
        classIds: ["d43593c715a56da27d-KANARIAPARTS2"],
        operator: "+",
      })
    ).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Base: Equippable", () => {
  it("should throw error", async () => {
    const baseClass = createBaseMock(0);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - skip passed param on purpose
      await baseClass.equippable({
        classIds: ["d43593c715a56da27d-KANARIAPARTS2"],
        operator: "+",
      });
    } catch (e) {
      expect(e.message).toMatch(
        "You can only change equippables on an existing Base. If you just created this, please load a new, separate instance as the block number is an important part of an Base's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Base: Equippable", () => {
  it("should throw error", async () => {
    const baseClass = createBaseMock(1);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - skip passed param on purpose
      await baseClass.equippable({
        classIds: ["d43593c715a56da27d-KANARIAPARTS2"],
        operator: "+",
      });
    } catch (e) {
      expect(e.message).toMatch(
        "You cannot change equippable without specifying slot"
      );
    }
  });
});

describe("rmrk2.0.0 Base: Get id", () => {
  it("should match snapshot", async () => {
    const baseClass = createBaseMock(1);
    expect(await baseClass.getId()).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Base: Get id", () => {
  it("should throw error", async () => {
    const baseClass = createBaseMock(0);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - skip passed param on purpose
      await baseClass.getId();
    } catch (e) {
      expect(e.message).toMatch(
        "This base is not minted, so it cannot have an ID."
      );
    }
  });
});

describe("rmrk2.0.0 Base: Add change", () => {
  it("should match snapshot", async () => {
    const baseClass = createBaseMock(0);
    expect(await baseClass.addChange(addChangeIssuerMock)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Base: Get changes", () => {
  it("should match snapshot", async () => {
    const baseClass = createBaseMock(0);
    await baseClass.addChange(addChangeIssuerMock);
    expect(await baseClass.getChanges()).toMatchSnapshot();
  });
});
