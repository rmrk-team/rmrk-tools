import { Consolidator, NFT } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  createCollectionMock2,
  getAliceKey,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock2,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { OP_TYPES } from "../../../src/rmrk2.0.0/tools/constants";
import { stringToHex } from "@polkadot/util";

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
        _mutation: {
          allowed: true,
        },
        value: "foo",
        type: "string",
      },
    },
  });

const mintGemNft = (block?: number) =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock2().id,
    symbol: "KANGEM",
    sn: "111".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
  });

const mintNftWithMutatorCondition = (block?: number) =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "888".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    properties: {
      test: {
        _mutation: {
          allowed: true,
          with: {
            opType: OP_TYPES.BURN,
            condition: "d43593c715a56da27d-KANARIAGEMS",
          },
        },
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
      royaltyInfo: {
        type: "royalty",
        value: {
          receiver: "xxx",
          royaltyPercentFloat: 0.2,
        },
        _mutation: {
          allowed: true,
        },
      },
    },
  });

describe("rmrk2.0.0 Consolidator: SETPROPERTY", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(createCollectionMock2().create()),
  ];

  it("should throw if we are trying to mutate immutable property", async () => {
    expect(() => mintNftWithProperties(5).setproperty("test", 2)).toThrow();
  });

  it("should throw if we are trying to mutate property with wrong rootowner _mutation", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(4).setproperty("test", "bar"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETPROPERTY] Attempting to set property on a non-owned NFT. Expected 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty but received 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
  });

  it("should throw if we are trying to mutate property with no matching extra call passed", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithMutatorCondition().mint()),
      ...getBlockCallsMock(
        mintNftWithMutatorCondition(4).setproperty("test", "bar")
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETPROPERTY] Attempting to mutate property without matching extra call of op type BURN"
    );
  });

  it("should throw if we are trying to mutate property with no matching extra call passed", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithMutatorCondition().mint()),
      ...getBlockCallsMock(
        mintNftWithMutatorCondition(4).setproperty("test", "bar"),
        undefined,
        [
          {
            call: "system.remark",
            value: stringToHex(mintNftWithMutatorCondition().mint()),
            caller: getAliceKey().address,
          },
        ]
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "The op code needs to be BURN, but it is MINT"
    );
  });

  it("should throw if we are trying to mutate property with no matching extra call condition", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithMutatorCondition().mint()),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(
        mintNftWithMutatorCondition(4).setproperty("test", "bar"),
        undefined,
        [
          {
            call: "system.remark",
            value: stringToHex(mintNftWithPropertiesOwner(5).burn()),
            caller: getAliceKey().address,
          },
        ]
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("should allow if we are trying to mutate property with matching mutation condition", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithMutatorCondition().mint()),
      ...getBlockCallsMock(mintGemNft().mint()),
      ...getBlockCallsMock(
        mintNftWithMutatorCondition(4).setproperty("test", "bar"),
        undefined,
        [
          {
            call: "system.remark",
            value: stringToHex(mintGemNft(5).burn()),
            caller: getAliceKey().address,
          },
        ]
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("should allow to mutate property if owner _mutator match", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(4).send(getBobKey().address)
      ), // Send to Bob first
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(4).setproperty("test", "bar"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("should be able to freeze property ", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithPropertiesOwner().mint()),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(4).setproperty("test", "bar", "freeze")
      ),
      ...getBlockCallsMock(
        mintNftWithPropertiesOwner(4).setproperty("test", "baz")
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETPROPERTY] Attempting to set property on immutable property test"
    );
  });

  it("should not allow to mutate royalty ", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftWithProperties().mint()),
      ...getBlockCallsMock(
        mintNftWithProperties(4).setproperty("royaltyInfo", {
          receiver: "xxx",
          royaltyPercentFloat: 0.3,
        })
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult.invalid[0].message).toEqual(
      "[SETPROPERTY] Attempting to mutate an attribute of type 'royalty'."
    );
  });
});
