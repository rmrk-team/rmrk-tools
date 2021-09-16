import { Consolidator } from "../../../src/rmrk2.0.0";
import {
  createCollectionMock,
  getAliceKey,
  getBlockCallsMock,
  getBobKey,
  getRemarksFromBlocksMock,
  mintNftMock, mintNftMock2, mintNftMock3,
} from "../mocks";
import { cryptoWaitReady } from "@polkadot/util-crypto";

beforeAll(async () => {
  return await cryptoWaitReady();
});

describe("rmrk2.0.0 Consolidator: BUY", () => {
  const getSetupRemarks = () => [
    ...getBlockCallsMock(createCollectionMock().create()),
    ...getBlockCallsMock(mintNftMock().mint()),
  ];

  it("Should allow you to BUY listed NFT for yourself", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should allow you to BUY listed NFT for someone else", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(
        mintNftMock(3).buy("5Cafn1kueAGQnrcvN2uHFQ5NaMznSMyrfeUzuDHDQsMRSsN6"),
        getBobKey().address,
        [
          {
            call: "balances.transfer",
            value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
            caller: getBobKey().address,
          },
        ]
      ),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should prevent you from BUYing unlisted NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should prevent you from BUYing non existent NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should prevent you from BUYing burned NFT", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).burn()),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should prevent you from BUYing NFT without a balance transfer", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should prevent you from BUYing NFT with incorrect balance transfer", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(2e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should prevent you from BUYing child NFT with incorrect balance transfer", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(mintNftMock2(4).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(2e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should correctly change rootowner of all child NFTs", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(mintNftMock3().mint(mintNftMock2(4).getId())),
      ...getBlockCallsMock(mintNftMock(3).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock(3).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("Should correctly change rootowner when child NFT is sold", async () => {
    const remarks = getRemarksFromBlocksMock([
      ...getSetupRemarks(),
      ...getBlockCallsMock(mintNftMock2().mint(mintNftMock(3).getId())),
      ...getBlockCallsMock(mintNftMock3().mint(mintNftMock2(4).getId())),
      ...getBlockCallsMock(mintNftMock3(5).list(BigInt(1e12))),
      ...getBlockCallsMock(mintNftMock3(5).buy(), getBobKey().address, [
        {
          call: "balances.transfer",
          value: `${getAliceKey().address},${BigInt(1e12).toString()}`,
          caller: getBobKey().address,
        },
      ]),
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
