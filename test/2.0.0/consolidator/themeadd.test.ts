import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createBaseMock,
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

describe("rmrk2.0.0 Consolidator: THEMEADD", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(createBaseMock().base()),
  ];

  it("Add theme to a base", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(4).themeadd({
          themeId: "theme2",
          theme: { primaryColor: "#000" },
        })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  // it("should fail to add theme with existing key", async () => {
  //   const remarks = getRemarksFromBlocksMock([
  //     ...getSetupRemarks(),
  //     ...getBlockCallsMock(
  //       createBaseMock(4).themeadd({
  //         themeId: "themeOne",
  //         theme: { primaryColor: "#000" },
  //       })
  //     ),
  //   ]);
  //   const consolidator = new Consolidator();
  //   const consolidatedResult = await consolidator.consolidate(remarks);
  //   expect(consolidatedResult).toMatchSnapshot();
  // });
});
