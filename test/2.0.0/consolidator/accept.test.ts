import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
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
    ...getBlockCallsMock(createCollectionMock().create()),
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
        mintNftMock(3).accept(resid, "RES"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].pending
    ).toBeFalsy();
  });

  it("Replace a resource on Accept", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        mintNftMock(3).accept(resid, "RES"),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock(3).resadd(
          {
            metadata: "ipfs://ipfs/125",
            id: "foo",
          },
          resid
        )
      ),
      ...getBlockCallsMock(
        mintNftMock(3).accept("foo", "RES"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].pending
    ).toBeFalsy();
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].id
    ).toEqual(resid);
  });

  it("Accept a child NFT on a NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock2().mint(getBobKey().address)),
      ...getBlockCallsMock(
        mintNftMock2(4).send(mintNftMock(3).getId()),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock(3).accept(mintNftMock2(4).getId(), "NFT")
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
        mintNftMock(4).accept(resid, "RES"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should invalidate accept if NFT is burned", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).burn(), getBobKey().address),
      ...getBlockCallsMock(
        mintNftMock(3).accept(resid, "RES"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
