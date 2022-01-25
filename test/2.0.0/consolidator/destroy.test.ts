import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getAliceKey,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
  mintNftMock,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: DESTROY", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
  ];

  it("Should DESTROY a Collection", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).burn(), getAliceKey().address),
      ...getBlockCallsMock(
        createCollectionMock(2).destroy(),
        getAliceKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should not DESTROY a Collection if it has unburned nft", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createCollectionMock(2).destroy(),
        getAliceKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
