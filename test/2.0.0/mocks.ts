import { getRemarksFromBlocks, NFT, Collection } from "../../src/rmrk2.0.0";
import { stringToHex, u8aToHex } from "@polkadot/util";
import { Remark } from "../../src/rmrk2.0.0/tools/consolidator/remark";
import { Block } from "../../src/rmrk2.0.0/tools/utils";
import { encodeAddress, Keyring } from "@polkadot/keyring";
import { Base } from "../../src/rmrk2.0.0/classes/base";
import { OP_TYPES } from "../../src/rmrk2.0.0/tools/constants";
import { BlockCall } from "../../src/rmrk2.0.0/tools/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { INftInstanceProps } from "../../src/rmrk2.0.0/classes/nft";

let block = 1;

export const getAliceKey = () => {
  const keyringAlice = new Keyring({ type: "sr25519" });
  return keyringAlice.addFromUri("//Alice");
};

export const getBobKey = () => {
  const keyringAlice = new Keyring({ type: "sr25519" });
  return keyringAlice.addFromUri("//Bob");
};

export const createCollectionMock = (
  block?: number,
  address?: string
): Collection => {
  return new Collection(
    block || 0,
    0,
    address || getAliceKey().address,
    "KANARIABIRDS",
    Collection.generateId(
      u8aToHex(address || getAliceKey().publicKey),
      "KANARIABIRDS"
    ),
    "https://some.url"
  );
};

export const createCollectionMock2 = (
  block?: number,
  keyring?: KeyringPair
): Collection => {
  return new Collection(
    block || 0,
    0,
    keyring?.address || getAliceKey().address,
    "KANARIAGEMS",
    Collection.generateId(
      u8aToHex(keyring?.publicKey || getAliceKey().publicKey),
      "KANARIAGEMS"
    ),
    "https://some.url"
  );
};

export const mintNftMock = (
  block?: number,
  nftInstanceProps?: Partial<INftInstanceProps>
): NFT =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "777".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    ...(nftInstanceProps || {}),
  });

export const mintNftMock2 = (
  block?: number,
  nftInstanceProps?: Partial<INftInstanceProps>
): NFT =>
  new NFT({
    block: block || 0,
    collection: createCollectionMock().id,
    symbol: "KANR",
    sn: "888".padStart(8, "0"),
    transferable: 1,
    owner: getAliceKey().address,
    ...(nftInstanceProps || {}),
  });

export const mintNftMock3 = (block?: number, collectionId?: string): NFT =>
  new NFT({
    block: block || 0,
    collection: collectionId || createCollectionMock().id,
    symbol: "KANR",
    sn: "999".padStart(8, "0"),
    transferable: 1,
    owner: getBobKey().address,
  });

export const createBaseMock = (block?: number): Base =>
  new Base(
    block || 0,
    "KBASE777",
    getAliceKey().address,
    "svg",
    [
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
          Collection.generateId(
            u8aToHex(getAliceKey().publicKey),
            "KANARIABIRDS"
          ),
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
    ],
    { themeOne: { _inherit: true, primary: "#fff" } }
  );

export const createBaseMock2 = (block?: number): Base =>
  new Base(
    block || 0,
    "KBASE777",
    getAliceKey().address,
    "svg",
    [
      {
        id: "background",
        type: "slot",
        equippable: [],
        z: 0,
      },
      {
        id: "background",
        type: "slot",
        equippable: [
          Collection.generateId(
            u8aToHex(getAliceKey().publicKey),
            "KANARIABIRDS"
          ),
        ],
        z: 1,
      },
    ],
    { themeOne: { _inherit: true, primary: "#fff" } }
  );

export const getBlockCallsMock = (
  remark: string,
  caller: string = getAliceKey().address,
  extras?: BlockCall[]
): Block[] => {
  block = block + 1;
  const blockCall: Block[] = [
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

  if (extras) {
    blockCall[0].calls[0].extras = extras;
  }

  return blockCall;
};

export const getRemarksFromBlocksMock = (blockCalls: Block[]): Remark[] => {
  block = 1;
  return getRemarksFromBlocks(blockCalls, ["0x726d726b", "0x524d524b"]);
};

export const addChangeIssuerMock = {
  field: "",
  old: "",
  new: "",
  caller: "",
  block: 0,
  opType: OP_TYPES.CHANGEISSUER,
};
