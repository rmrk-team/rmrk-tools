import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createNftClassMock,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock,
  mintNftMock2,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: ACCEPT", () => {
  const resid = "jXhhR";
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createNftClassMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
    ...getBlockCallsMock(
      mintNftMock(3).resadd({ metadata: "ipfs://ipfs/123", id: resid })
    ),
  ];

  it("Accept a resource on a NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        mintNftMock(3).accept(resid, "resource"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.nfts[0].resources[0].pending).toBeFalsy();
  });

  it("Accept a child NFT on a NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createNftClassMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock2().mint(getBobKey().address)),
      ...getBlockCallsMock(
        mintNftMock2(4).send(mintNftMock(3).getId()),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock(3).accept(mintNftMock2(4).getId(), "nft")
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should invalidate accept if NFT doesn't exist", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        mintNftMock(4).accept(resid, "resource"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    console.log(consolidatedResult.invalid);
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should invalidate accept if NFT is burned", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).consume(), getBobKey().address),
      ...getBlockCallsMock(
        mintNftMock(3).accept(resid, "resource"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    console.log(consolidatedResult.invalid);
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
