import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getAliceKey,
  getBlockCallsMock,
  getRemarksFromBlocksMock,
  mintNftMock,
  mintNftMock2,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: LOCK", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(mintNftMock2().mint()),
  ];

  it("Should LOCK a Collection", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).burn(), getAliceKey().address),
      ...getBlockCallsMock(
        createCollectionMock(2).lock(),
        getAliceKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
