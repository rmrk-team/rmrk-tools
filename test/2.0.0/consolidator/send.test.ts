import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  createCollectionMock2,
  createCollectionMock3,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock,
  mintNftMock2,
  mintNftMock3,
  mintNftMock4,
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
    const consolidator = new Consolidator(2, undefined, false, true);
    const result = await consolidator.consolidate(remarks);
    expect(result).toMatchSnapshot();
  });

  it("Should convert recipient according to passed ss58Format", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2(4).send(getBobKey().address)),
    ]);
    const consolidator = new Consolidator(0);
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

  it("Should set NFT as pending if sent to non owned NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createCollectionMock2(0, getBobKey()).create(),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock3(0, createCollectionMock2(0, getBobKey()).id).mint(),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock2(4).send(
          mintNftMock3(6, createCollectionMock2(0, getBobKey()).id).getId()
        )
      ), // Send to Bob's NFT
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should invalidate SEND if recursion detected", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock3().mint(mintNftMock2(4).getId())),
      ...getBlockCallsMock(mintNftMock2(4).send(mintNftMock3(5).getId())),
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "Cannot have an nft that is it's own child"
    );
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
      ...getBlockCallsMock(
        createCollectionMock2(0, getBobKey()).create(),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock3(0, createCollectionMock2(0, getBobKey()).id).mint(),
        getBobKey().address
      ),
      ...getBlockCallsMock(
        mintNftMock3(6, createCollectionMock2(0, getBobKey()).id).send(
          mintNftMock(3).getId()
        )
      ), // Send to another NFT first
      ...getBlockCallsMock(nftMock.send(getBobKey().address)), // Send to Bob
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to send non-owned NFT 6-8eaf04151694f26a48-KANARIAGEMS-KANR-00000999, real owner: FoQJpPyadYccjavVdTWxpxU7rUEaYhfLCPwXgkfD6Zat9QP"
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

  it("Should invalidate SEND to before elapsed block number passed as transferable value", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock(0, { transferable: 5 }).mint()),
      ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to SEND non-transferable NFT 3-d43593c715a56da27d-KANARIABIRDS-KANR-00000777. It will become transferable after block 5 but tx made at block 4"
    );
  });

  it("Should invalidate SEND to before elapsed block number passed as a NEGATIVE transferable value", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock(0, { transferable: -1 }).mint()),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "[SEND] Attempting to SEND non-transferable NFT 3-d43593c715a56da27d-KANARIABIRDS-KANR-00000777. It was transferable until block 4 but tx made at block 5"
    );
  });

  it("Should allow SEND until elapsed block number passed as a NEGATIVE transferable value", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock(0, { transferable: -2 }).mint()),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should allow SEND if transferable block reached", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock(0, { transferable: 4 }).mint()),
      ...getBlockCallsMock(mintNftMock(3).send(getBobKey().address)),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should allow SEND if collection id has space", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock3().create()),
      ...getBlockCallsMock(mintNftMock3(0, createCollectionMock3(0).id).mint()),
      ...getBlockCallsMock(mintNftMock4(0, createCollectionMock3(0).id).mint()),
      ...getBlockCallsMock(
        mintNftMock4(4, createCollectionMock3(0).id).send(
          mintNftMock4(3, createCollectionMock3(0).id).getId()
        )
      ),
    ]);

    const consolidator = new Consolidator();
    const consolidatedResult = await consolidator.consolidate(remarks);

    const nft = Object.values(consolidatedResult.nfts)[1];
    expect(nft.owner).toEqual(
      mintNftMock4(3, createCollectionMock3(0).id).getId()
    );
  });
});
