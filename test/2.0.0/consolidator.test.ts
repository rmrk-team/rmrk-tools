import { Consolidator } from "../../src/rmrk2.0.0";
import {
  createNftClassMock,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
  mintNftMock,
  mintNftMock2,
} from "./mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: CREATE NFT CLASS", () => {
  it("should work", async () => {
    const remarks = getRemarksFromBlocksMock(
      getBlockCallsMock(createNftClassMock().create())
    );
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});

describe("rmrk2.0.0 Consolidator: Send NFT to other NFT", () => {
  it("should work", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createNftClassMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock2().mint()),
      ...getBlockCallsMock(mintNftMock2(5).send(mintNftMock(4).getId())),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
