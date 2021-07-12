import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
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
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(createBaseMock().base()),
  ];

  it("Add new Collection id to Base slot equippable", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable({
          slot: "background",
          collections: [createCollectionMock().id],
          operator: "+",
        })
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Remove new Collection id to Base slot equippable", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable({
          slot: "backpack",
          collections: [createCollectionMock().id],
          operator: "-",
        })
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Replace a Collection id to Base slot equippable", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable({
          slot: "backpack",
          collections: ["*"],
          operator: "",
        })
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should invalidate EQUIPPABLE if base parts slot is missing", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createBaseMock(3).equippable({
          slot: "test",
          collections: [createCollectionMock().id],
          operator: "+",
        })
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
        createBaseMock(5).equippable({
          slot: "test",
          collections: [createCollectionMock().id],
          operator: "+",
        })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[EQUIPPABLE] Attempting to change equippable on non-existant NFT base-5-KBASE777"
    );
  });
});
