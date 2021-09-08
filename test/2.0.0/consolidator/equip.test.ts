import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createBaseMock,
  createCollectionMock,
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

describe("rmrk2.0.0 Consolidator: EQUIP", () => {
  const resid = "jXhhR";
  const resid2 = "xXhhR";
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(createBaseMock().base()),
    ...getBlockCallsMock(
      mintNftMock(3).resadd({
        base: createBaseMock(4).getId(),
        id: resid2,
        parts: ["background", "backpack", "tail"],
      })
    ),
    ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
    ...getBlockCallsMock(
      mintNftMock2(6).resadd({
        slot: `${createBaseMock(4).getId()}.${createBaseMock(4).parts?.[1].id}`,
        id: resid,
      })
    ),
    ...getBlockCallsMock(
      mintNftMock2(6).equip(
        `${createBaseMock(4).getId()}.${createBaseMock(4).parts?.[1].id}`
      )
    ),
  ];

  it("Equip NFT on another NFT successfully", async () => {
    const remarks = getRemarksFromBlocksMock([...getSetupRemarks()]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("UNEquip NFT on another NFT successfully", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2(6).equip("")),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip non existent NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(
        mintNftMock2(6).equip(
          `${createBaseMock(4).getId()}.${createBaseMock(4).parts?.[1].id}`
        )
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip burned NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock(3).burn()),
      ...getBlockCallsMock(mintNftMock(3).equip("base-test.test")),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip NFT on a non-existent parent NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock(3).equip("base-test.test")),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip non-owned NFT ", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint(getBobKey().address)),
      ...getBlockCallsMock(mintNftMock2().mint(getBobKey().address)),
      ...getBlockCallsMock(mintNftMock(3).send(mintNftMock2(4).getId())),
      ...getBlockCallsMock(mintNftMock(3).equip("base-test.test")),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip not accepted NFT ", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint(getBobKey().address)),
      ...getBlockCallsMock(mintNftMock2().mint()),
      ...getBlockCallsMock(mintNftMock2(4).send(mintNftMock(3).getId())),
      ...getBlockCallsMock(
        mintNftMock2(4).equip("base-test.test"),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip NFT without compatible resource", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(createBaseMock().base()),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({
          base: createBaseMock(4).getId(),
          id: resid2,
        })
      ),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(
        mintNftMock2(6).resadd({
          slot: `base-incompatible.slot`,
          id: resid,
        })
      ),
      ...getBlockCallsMock(
        mintNftMock2(6).equip(
          `${createBaseMock(4).getId()}.${createBaseMock(4).parts?.[1].id}`
        )
      ),
    ]);

    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip NFT without it's base slot whitelisting this collection", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(createBaseMock().base()),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({ base: createBaseMock(4).getId(), id: resid2 })
      ),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(
        mintNftMock2(6).resadd({
          slot: `${createBaseMock(4).getId()}.${
            createBaseMock(4).parts?.[0].id
          }`,
          id: resid,
        })
      ),
      ...getBlockCallsMock(
        mintNftMock2(6).equip(
          `${createBaseMock(4).getId()}.${createBaseMock(4).parts?.[0].id}`
        )
      ),
    ]);

    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });

  it("Should fail to Equip NFT while base is still pending accept", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint(getBobKey().address)),
      ...getBlockCallsMock(createBaseMock().base()),
      ...getBlockCallsMock(
        mintNftMock(3).resadd({ base: createBaseMock(4).getId(), id: resid2 })
      ),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(
        mintNftMock2(6).resadd({
          slot: `${createBaseMock(4).getId()}.${
            createBaseMock(4).parts?.[1].id
          }`,
          id: resid,
        })
      ),
      ...getBlockCallsMock(
        mintNftMock(3).accept(mintNftMock2(6).getId(), "NFT"),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock2(6).equip(
          `${createBaseMock(4).getId()}.${createBaseMock(4).parts?.[1].id}`
        ),
        getBobKey().address
      ),
    ]);

    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);
    expect(consolidatedResult).toMatchSnapshot();
  });
});
