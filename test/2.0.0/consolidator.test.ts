import { Consolidator } from "../../src/rmrk2.0.0";
import {
  createNftClassMock,
  getBlockCallsMock,
  getBobKey,
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
  it("Add new NFT as child of first NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createNftClassMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock2().mint()),
      ...getBlockCallsMock(mintNftMock2(4).send(mintNftMock(3).getId())),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should set NFT as pending if sent from non parent owner", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createNftClassMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock2().mint()),
      ...getBlockCallsMock(mintNftMock2(4).send(getBobKey().address)), // Send to Bob first
      ...getBlockCallsMock(
        mintNftMock2(4).send(mintNftMock(3).getId()),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
