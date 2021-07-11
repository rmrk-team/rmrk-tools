import { getRemarksFromBlocks, NFT, NftClass } from "../../src/rmrk2.0.0";
import { stringToHex, u8aToHex } from "@polkadot/util";
import { Remark } from "../../src/rmrk2.0.0/tools/consolidator/remark";
import { Block } from "../../src/rmrk2.0.0/tools/utils";
import { encodeAddress, Keyring } from "@polkadot/keyring";
import { Base } from "../../src/rmrk2.0.0/classes/base";

let block = 1;

const getAliceKey = () => {
  const keyringAlice = new Keyring({ type: "sr25519" });
  return keyringAlice.addFromUri("//Alice");
};

export const getBobKey = () => {
  const keyringAlice = new Keyring({ type: "sr25519" });
  return keyringAlice.addFromUri("//Bob");
};

export const createNftClassMock = (block?: number): NftClass => {
  return new NftClass(
    block || 0,
    0,
    getAliceKey().address,
    "KANARIABIRDS",
    NftClass.generateId(u8aToHex(getAliceKey().publicKey), "KANARIABIRDS"),
    "https://some.url"
  );
};

export const mintNftMock = (block?: number): NFT =>
  new NFT({
    block: block || 0,
    nftclass: createNftClassMock().id,
    symbol: "KANR",
    sn: "777".padStart(16, "0"),
    transferable: 1,
    owner: getAliceKey().address,
  });

export const mintNftMock2 = (block?: number): NFT =>
  new NFT({
    block: block || 0,
    nftclass: createNftClassMock().id,
    symbol: "KANR",
    sn: "888".padStart(16, "0"),
    transferable: 1,
    owner: getAliceKey().address,
  });

export const mintNftMock3 = (block?: number): NFT =>
  new NFT({
    block: block || 0,
    nftclass: createNftClassMock().id,
    symbol: "KANR",
    sn: "999".padStart(16, "0"),
    transferable: 1,
    owner: getBobKey().address,
  });

export const createBaseMock = (block?: number): Base =>
  new Base(block || 0, "KBASE777", getAliceKey().address, "svg", [
    {
      id: "background",
      type: "slot",
      equippable: [],
      z: 0,
    },
    {
      id: "backpack",
      type: "slot",
      equippable: [
        NftClass.generateId(u8aToHex(getAliceKey().publicKey), "KANARIABIRDS"),
      ],
      z: 1,
    },
    {
      id: "tail",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_tail.svg",
      z: 2,
    },
  ]);

export const getBlockCallsMock = (
  remark: string,
  caller: string = getAliceKey().address
): Block[] => {
  block = block + 1;
  return [
    {
      block: block,
      calls: [
        {
          call: "system.remark",
          value: stringToHex(remark),
          caller: caller,
        },
      ],
    },
  ];
};

export const getRemarksFromBlocksMock = (blockCalls: Block[]): Remark[] => {
  block = 1;
  return getRemarksFromBlocks(blockCalls, ["0x726d726b", "0x524d524b"]);
};
