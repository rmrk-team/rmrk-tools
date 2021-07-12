import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
  addChangeIssuerMock,
  mintNftMock,
  getBobKey,
  createBaseMock,
} from "../mocks";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Nft: Get id", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.getId()).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Get id", () => {
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

describe("rmrk2.0.0 Nft: Add change", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock();
    expect(await nft.addChange(addChangeIssuerMock)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Mint", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(0);
    expect(await nft.mint(getBobKey().address)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Mint", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(1);
    try {
      await nft.mint(getBobKey().address);
    } catch (e) {
      expect(e.message).toMatch("An already existing NFT cannot be minted!");
    }
  });
});

describe("rmrk2.0.0 Nft: Send", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.send(getBobKey().address)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Send", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.send(getBobKey().address);
    } catch (e) {
      expect(e.message).toMatch(
        "You can only send an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Nft: List", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.list(1000)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: List", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.list(1000);
    } catch (e) {
      expect(e.message).toMatch(
        "You can only list an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Nft: Buy", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.buy(getBobKey().address)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Buy", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.buy(getBobKey().address);
    } catch (e) {
      expect(e.message).toMatch(
        "You can only buy an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Nft: Consume", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.consume()).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Consume", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.consume();
    } catch (e) {
      expect(e.message).toMatch(
        "You can only consume an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Nft: Emote", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.emote("1F600")).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Emote", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.emote("1F600");
    } catch (e) {
      expect(e.message).toMatch(
        "You can only emote on an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Nft: Resadd", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(
      await nft.resadd({ base: createBaseMock(4).getId(), id: "xXhhR" })
    ).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Resadd", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.resadd({ base: createBaseMock(4).getId(), id: "xXhhR" });
    } catch (e) {
      expect(e.message).toMatch(
        "You can only add resource to an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});

describe("rmrk2.0.0 Nft: Accept", () => {
  it("should match snapshot", async () => {
    const nft = mintNftMock(1);
    expect(await nft.accept("jXhhR", "resource")).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Nft: Accept", () => {
  it("should throw error", async () => {
    const nft = mintNftMock(0);
    try {
      await nft.accept("jXhhR", "resource");
    } catch (e) {
      expect(e.message).toMatch(
        "You can only accept resource to an existing NFT. If you just minted this, please load a new, separate instance as the block number is an important part of an NFT's ID."
      );
    }
  });
});
