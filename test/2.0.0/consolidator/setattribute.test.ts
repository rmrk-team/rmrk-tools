import { Consolidator, NFT } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getAliceKey,
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

const mintNftWithPropertiesIssuer = (block?: number) =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "777".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    properties: {
      test: {
        _mutator: "issuer",
        value: "foo",
        type: "string",
      },
    },
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
        _mutator: "owner",
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

const mintNftWithProperties2 = (block?: number) =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "777".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    properties: {
      test: {
        _mutator: "boo",
        value: "foo",
        type: "string",
      },
    },
  });

describe("rmrk2.0.0 Consolidator: SETATTRIBUTE", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
  ];

  it("Mint NFT with properties", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesIssuer().mint()),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("should throw if we are trying to mutate immutable attribute", async () => {
    expect(() =>
      mintNftWithProperties(3).setattribute("test", {
        type: "int",
        value: 2,
      })
    ).toThrow();

    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithProperties2().mint()),
      ...getBlockCallsMock(
        mintNftWithProperties2(3).setattribute("test", {
          type: "int",
          value: 2,
        })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETATTRIBUTE] Attempting to set attribute on immutable attribute test"
    );
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
      "[SETATTRIBUTE] Attempting to set attribute on and NFT where rootowner is _mutator don't match. Expected 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty but received 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
  });

  it("should throw if we are trying to mutate attribute with wrong issuer _mutator", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesIssuer().mint()),
      ...getBlockCallsMock(
        mintNftWithPropertiesIssuer(3).setattribute("test", {
          type: "int",
          value: 2,
        }),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETATTRIBUTE] Attempting to set attribute on and NFT where issuer is _mutator don't match. Expected 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty but received 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
  });

  it("should allow to mutate attribute if issuer _mutator match", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesIssuer().mint()),
      ...getBlockCallsMock(mintNftMock2(3).send(getBobKey().address)), // Send to Bob first
      ...getBlockCallsMock(
        mintNftWithPropertiesIssuer(3).setattribute("test", {
          type: "int",
          value: 2,
        })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
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
});
