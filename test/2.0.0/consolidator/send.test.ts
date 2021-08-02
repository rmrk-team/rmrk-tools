import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock,
  mintNftMock2,
  mintNftMock3,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: Send NFT to other NFT", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(mintNftMock2().mint()),
  ];

  it("Add new NFT as child of first NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2(4).send(mintNftMock(3).getId())),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Add new NFT as child of first NFT and then send it to different parent NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock3().mint()),
      ...getBlockCallsMock(mintNftMock2(4).send(mintNftMock(3).getId())),
      ...getBlockCallsMock(mintNftMock2(4).send(mintNftMock3(5).getId())),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("rootowner should be updated recursivly", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint()),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(mintNftMock3().mint(mintNftMock2(4).getId())),
      ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should set NFT as pending if sent from non parent owner", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2(4).send(getBobKey().address)), // Send to Bob first
      ...getBlockCallsMock(
        mintNftMock2(4).send(mintNftMock(3).getId()),
        getBobKey().address
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should invalidate SEND to non-existant NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2(99).send(getBobKey().address)), // Send to Bob first
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to send non-existant NFT 99-d43593c715a56da27d-KANARIABIRDS-KANR-00000888"
    );
  });

  it("Should invalidate SEND to burned NFT", async () => {
    const nftMock = mintNftMock2(4);
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(nftMock.burn()),
      ...getBlockCallsMock(nftMock.send(getBobKey().address)), // Send to Bob first
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to send burned NFT 4-d43593c715a56da27d-KANARIABIRDS-KANR-00000888"
    );
  });

  it("Should invalidate SEND of non-owned child NFT", async () => {
    const nftMock = mintNftMock2(4);
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock3().mint(), getBobKey().address),
      ...getBlockCallsMock(mintNftMock3(5).send(mintNftMock(3).getId())), // Send to another NFT first
      ...getBlockCallsMock(nftMock.send(getBobKey().address)), // Send to Bob
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to send non-owned NFT 5-d43593c715a56da27d-KANARIABIRDS-KANR-00000999, real owner: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
    );
  });

  it("Should invalidate SEND to non-existant NFT", async () => {
    const nftMock = mintNftMock2(4);
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(nftMock.send(mintNftMock(5).getId())),
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to send NFT to a non existing NFT 5-d43593c715a56da27d-KANARIABIRDS-KANR-00000777."
    );
  });
});
