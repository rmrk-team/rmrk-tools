import { Consolidator, NFT } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getBlockCallsMock,
  getAliceKey,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock,
  mintNftMock2,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: MINT", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
    ...getBlockCallsMock(mintNftMock2().mint()),
  ];

  it("Should mint a NFT and make another account owner", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock().mint(getBobKey().address)),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should mint a NFT and make another NFT an owner", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(mintNftMock2().mint()),
      ...getBlockCallsMock(mintNftMock().mint(mintNftMock2(4).getId())),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should not allow to mint a NFT without a calss", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(mintNftMock().mint()),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should allow to mint NFT with royalties", async () => {
    const nft = new NFT({
      block: 0,
      collection: createCollectionMock().id,
      symbol: "KANR",
      sn: "999".padStart(8, "0"),
      transferable: 1,
      owner: getBobKey().address,
      properties: {
        royaltyInfo: {
          type: "royalty",
          value: {
            royaltyPercentFloat: 2.3,
            receiver: getBobKey().address,
          },
        },
      },
    });

    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(nft.mint()),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should not allow to mint NFT with invalid royalties", async () => {
    const nft = new NFT({
      block: 0,
      collection: createCollectionMock().id,
      symbol: "KANR",
      sn: "999".padStart(8, "0"),
      transferable: 1,
      owner: getBobKey().address,
      properties: {
        royaltyInfo: {
          type: "royalty",
          value: {
            royaltyPercentFloat: 101,
            receiver: getBobKey().address,
          },
        },
      },
    });

    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(createCollectionMock().create()),
      ...getBlockCallsMock(nft.mint()),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
  
  it("Should prevent minting NFT into locked collection", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(
        createCollectionMock(2).lock(),
        getAliceKey().address
      ),
      ...getBlockCallsMock(mintNftMock2().mint()),
    ]);
    const consolidator = new Consolidator();
    const consolidated = await consolidator.consolidate(remarks);
    expect(consolidated.invalid[0].message).toEqual(
      "Attempted to mint into maxed out collection d43593c715a56da27d-KANARIABIRDS"
    );
  });
});
