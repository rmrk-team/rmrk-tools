import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
  mintNftMock,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: SETPRIORITY", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(
      mintNftMock(3).resadd({ metadata: "ipfs://ipfs/123", id: 'foo' })
    ),
  ];

  it("Should add newly added resource id to priority array", async () => {
    const remarks = getRemarksFromBlocksMock([...getSetupRemarks()]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].resources[0].id
    ).toEqual(consolidatedResult.nfts[mintNftMock(3).getId()].priority[0]);
  });

  it("Should not allow to set priority of a resource that doesn't exist", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).setpriority(["bar", "foo"])),
    ]);

    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);

    expect(
      consolidatedResult.nfts[mintNftMock(3).getId()].priority.includes("bar")
    ).toBeFalsy();
  });
});
