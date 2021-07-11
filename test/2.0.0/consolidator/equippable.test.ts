import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createNftClassMock,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  createBaseMock,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: EQUIPPABLE", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createNftClassMock().create()),
    ...getBlockCallsMock(createBaseMock().base()),
  ];

  it("Add new Class id to Base slot equippable", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable(
          "background",
          [createNftClassMock().id],
          "+"
        )
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Remove new Class id to Base slot equippable", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable("backpack", [createNftClassMock().id], "-")
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Replace a Class id to Base slot equippable", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(createBaseMock(3).equippable("backpack", ["*"], "")),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should invalidate EQUIPPABLE if base parts slot is missing", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable("test", [createNftClassMock().id], "+")
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[EQUIPPABLE] Attempting to change equippable on non-existant part with a slot id test"
    );
  });

  it("Should invalidate EQUIPPABLE if base is missing", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(5).equippable("test", [createNftClassMock().id], "+")
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[EQUIPPABLE] Attempting to change equippable on non-existant NFT base-5-KBASE777"
    );
  });
});
