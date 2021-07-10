import { getRemarksFromBlocks, NFT, NftClass } from "../../src/rmrk2.0.0";
import { stringToHex, u8aToHex } from "@polkadot/util";
import { Remark } from "../../src/rmrk2.0.0/tools/consolidator/remark";
import { Block } from "../../src/rmrk2.0.0/tools/utils";
import { Keyring } from "@polkadot/keyring";

const getKey = () => {
  const keyringAlice = new Keyring({ type: "sr25519" });
  return keyringAlice.addFromUri("//Alice");
};

export const createNftClassMock = (): NftClass =>
  new NftClass(
    0,
    0,
    getKey().address,
    "KANARIABIRDS",
    NftClass.generateId(u8aToHex(getKey().publicKey), "KANARIABIRDS"),
    "https://some.url"
  );

export const mintNftMock = (): NFT =>
  new NFT({
    block: 0,
    nftclass: createNftClassMock().id,
    symbol: "KANR",
    sn: "777".padStart(16, "0"),
    transferable: 1,
    owner: getKey().address,
  });

export const getBlockCallsMock = (remark: string): Block[] => [
  {
    block: 1,
    calls: [
      {
        call: "system.remark",
        value: stringToHex(remark),
        caller: "D6HSL6nGXHLYWSN8jiL9MSNixH2F2o382KkHsZAtfZvBnxM",
      },
    ],
  },
];

export const getRemarksFromBlocksMock = (blockCalls: Block[]): Remark[] =>
  getRemarksFromBlocks(blockCalls, ["0x726d726b", "0x524d524b"]);
