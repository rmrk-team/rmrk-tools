import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: RESADD", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
  ];

  it("Send resource to an NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({ metadata: "ipfs://ipfs/123" })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].pending
    ).toBeFalsy();
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].metadata
    ).toEqual("ipfs://ipfs/123");
    expect(consolidatedResult.nfts[mintNftMock(3).getId()].priority[0]).toEqual(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].id
    );
  });

  it("Replace existing resource on an NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({ metadata: "ipfs://ipfs/123", id: "foo" })
      ),
      ...getBlockCallsMock(
        mintNftMock(3).resadd(
          {
            metadata: "ipfs://ipfs/125",
            id: "bar",
          },
          "foo"
        )
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].pending
    ).toBeFalsy();
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].metadata
    ).toEqual("ipfs://ipfs/125");
    expect(consolidatedResult.nfts[mintNftMock(3).getId()].priority[0]).toEqual(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].id
    );
  });

  it("Should not allow to add a resource to a NFT in non-owned collection", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({ metadata: "ipfs://ipfs/123" }),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[RESADD] Attempting to add resource to NFT in non-owned collection d43593c715a56da27d-KANARIABIRDS"
    );
  });

  it("Should add pending resource if non-owner adds a resource", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({ metadata: "ipfs://ipfs/123" })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].pending
    ).toBeTruthy();
  });
});
