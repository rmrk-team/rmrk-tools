import { Consolidator, NFT } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getAliceKey,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock2,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

const mintNftWithPropertiesOwner = (block?: number) =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "777".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    properties: {
      test: {
        _mutable: true,
        value: "foo",
        type: "string",
      },
    },
  });

const mintNftWithProperties = (block?: number) =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "777".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    properties: {
      test: {
        value: "foo",
        type: "string",
      },
    },
  });

describe("rmrk2.0.0 Consolidator: SETATTRIBUTE", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
  ];

  it("should throw if we are trying to mutate immutable attribute", async () => {
    expect(() =>
      mintNftWithProperties(5).setattribute("test", {
        type: "int",
        value: 2,
      })
    ).toThrow();

    // const remarks = getRemarksFromBlocksMock([
    //   ...getSetupRemarks(),
    //   ...getBlockCallsMock(mintNftWithProperties().mint()),
    //   ...getBlockCallsMock(
    //     mintNftWithProperties(3).setattribute("test", {
    //       type: "int",
    //       value: 2,
    //     })
    //   ),
    // ]);
    // const consolidator = new Consolidator();
    // const consolidatedResult = await consolidator.consolidate(remarks);
    // expect(consolidatedResult.invalid[0].message).toEqual(
    //   "[SETATTRIBUTE] Attempting to set attribute on immutable attribute test"
    // );
  });

  it("should throw if we are trying to mutate attribute with wrong rootowner _mutator", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(3).setattribute("test", {
          type: "int",
          value: 2,
        }),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETATTRIBUTE] Attempting to set attribute on a non-owned NFT. Expected 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty but received 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
  });

  it("should allow to mutate attribute if owner _mutator match", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(mintNftMock2(3).send(getBobKey().address)), // Send to Bob first
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(3).setattribute("test", {
          type: "int",
          value: 2,
        }),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("should be able to freeze attribute ", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(3).setattribute(
          "test",
          {
            type: "int",
            value: 2,
          },
          "freeze"
        )
      ),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(3).setattribute("test", {
          type: "float",
          value: 3,
        })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETATTRIBUTE] Attempting to set attribute on immutable attribute test"
    );
  });
});
