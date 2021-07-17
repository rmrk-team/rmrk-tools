import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { u8aToHex } from "@polkadot/util";
import getKeys from "../devaccs";
import {
  Collection,
  CollectionMetadata,
} from "../../../src/rmrk2.0.0/classes/collection";
import { NFT } from "../../../src/rmrk2.0.0";
import { Base, IBasePart } from "../../../src/rmrk2.0.0/classes/base";
import { Equippable } from "../../../src/rmrk2.0.0/classes/equippable";
import { encodeAddress } from "@polkadot/keyring";
import { Resadd } from "../../../src/rmrk2.0.0/classes/resadd";
import { NFTMetadata } from "../../../src/rmrk2.0.0/classes/nft";
// @ts-ignore
import pinataSDK from "@pinata/sdk";
import fs from "fs";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Attribute } from "../../../src/rmrk2.0.0/tools/types";
import { getApi } from "../../../src/rmrk2.0.0/tools/utils";
import { nanoid } from "nanoid";

const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);
const fsPromises = fs.promises;
const defaultOptions = {
  pinataOptions: {
    cidVersion: 1,
  },
};

// const WS_URL = "wss://staging.node.rmrk.app";
const WS_URL = "ws://127.0.0.1:9944";

const slotsParts = {
  background: 0,
  foreground: 18,
  headwear: 13,
  backpack: 1,
  objectLeft: 14,
  objectRight: 15,
  necklace: 12,
};

// const fixedSlotsGems = [
//   "gemslot1",
//   "gemslot2",
//   "gemslot3",
//   "gemslot4",
//   "gemslot5",
// ];

const fixedPartsMap = {
  tail: 2,
  wingleft: 3,
  body: 4,
  footleft: 5,
  footright: 6,
  top: 7,
  wingright: 8,
  head: 9,
  eyes: 10,
  beak: 11,
  handright: 16,
  handleft: 17,
};

const getFixedKanariaParts = (
  partsByEmote: {
    slot: string;
    resources: string[];
  }[]
): IBasePart[] => {
  const fixedParts: IBasePart[] = [];
  partsByEmote.forEach((part) => {
    if (
      part.slot !== "object" &&
      !Object.keys(slotsParts).includes(part.slot)
    ) {
      fixedParts.push({
        type: "fixed",
        id: part.resources[0].replace(".svg", ""),
        src: `ipfs://ipfs/QmeXUDt9hpoUGRdGiahLSQmf5fegUJ5Jm6fei1xnBeNuDK/${part.resources[0].slice(
          0,
          part.resources[0].indexOf("_")
        )}/${part.resources[0]}`,
        // @ts-ignore
        z: fixedPartsMap[part.slot],
      });
    }
  });

  return fixedParts;
};

const getSlotKanariaParts = (equippable: string[] | "*" = []): IBasePart[] => {
  const slotParts: IBasePart[] = [];
  Object.keys(slotsParts).forEach((slotid) => {
    slotParts.push({
      type: "slot",
      id: slotid,
      equippable,
      // @ts-ignore
      z: slotsParts[slotid],
    });
  });

  return slotParts;
};

const getBaseParts = (equippable: string[] | "*" = []) => {
  const BIRD_1_BASE_PARTS: IBasePart[] = [
    {
      id: "background",
      type: "slot",
      equippable,
      z: 0,
    },
    {
      id: "backpack",
      type: "slot",
      equippable,
      z: 1,
    },
    {
      id: "tail",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_tail.svg",
      z: 2,
    },
    {
      id: "wingleft",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_wingLeft.svg",
      z: 3,
    },
    {
      id: "body",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_body.svg",
      z: 4,
    },
    {
      id: "footleft",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_footLeft.svg",
      z: 5,
    },
    {
      id: "footright",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_footRight.svg",
      z: 6,
    },
    {
      id: "top",
      type: "fixed",
      z: 7,
    },
    {
      id: "wingright",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_wingRight.svg",
      z: 8,
    },
    {
      id: "head",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_head.svg",
      z: 9,
    },
    {
      id: "eyes",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_eyes.svg",
      z: 10,
    },
    {
      id: "beak",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_beak.svg",
      z: 11,
    },
    {
      id: "necklace",
      type: "slot",
      equippable,
      z: 12,
    },
    {
      id: "headwear",
      type: "slot",
      equippable,
      z: 13,
    },
    {
      id: "objectleft",
      type: "slot",
      equippable,
      z: 14,
    },
    {
      id: "objectright",
      type: "slot",
      equippable,
      z: 15,
    },
    {
      id: "handright",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_handRight.svg",
      z: 16,
    },
    {
      id: "handleft",
      type: "fixed",
      src:
        "ipfs://ipfs/QmcEuigDVCScMLs2dcrJ8qU4Q265xGisUyKeYdnnGFn6AE/var3_handLeft.svg",
      z: 17,
    },
    {
      id: "foreground",
      type: "slot",
      equippable,
      z: 18,
    },
    {
      id: "gemslot1",
      type: "fixed",
      z: 90,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_01_decayed.svg",
    },
    {
      id: "gemslot2",
      type: "slot",
      equippable,
      z: 91,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_02_openslot.svg",
    },
    {
      id: "gemslot3",
      type: "slot",
      equippable,
      z: 92,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_03_openslot.svg",
    },
    {
      id: "gemslot4",
      type: "slot",
      equippable,
      z: 93,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_04_openslot.svg",
    },
    {
      id: "gemslot5",
      type: "slot",
      equippable,
      z: 94,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_05_openslot.svg",
    },
  ];

  return BIRD_1_BASE_PARTS;
};

let classBlock = 0;
// let nftBlock = 0;
let baseBlock = 0;

export const seedKanariaBase = async (nfts: NFT[], nftMintBlock: number) => {
  try {
    const ws = WS_URL;
    const phrase = "//Alice";
    console.log("Connecting...");
    const api = await getApi(ws);
    console.log("Connected.");

    const kp = getKeyringFromUri(phrase);
    const kp2 = getKeyringFromUri("//Bob");

    const collections = await getCollections();
    const equippable = collections.map((collection) => collection.id);
    const emotesBreakdownRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/emote-resources.json`
    );

    const emotesBreakdownRawJson: {
      slot: string;
      resources: string[];
    }[] = JSON.parse(emotesBreakdownRaw.toString());

    const baseParts = [
      ...getFixedKanariaParts(emotesBreakdownRawJson),
      ...getSlotKanariaParts(equippable),
    ];
    console.log(baseParts);
    const base = new Base(
      0,
      "KANBASE",
      encodeAddress(kp.address, 2),
      "svg",
      baseParts
    );

    const txs = [base.base()].map((remark) => api.tx.system.remark(remark));
    await api.tx.utility.batch(txs).signAndSend(kp, async ({ status }) => {
      if (status.isInBlock) {
        console.log(`included in ${status.asInBlock}`);
        const block = await api.rpc.chain.getBlock(status.asInBlock);
        console.log(
          "BASE BLOCK NUMBER: ",
          block.block.header.number.toNumber()
        );

        seedKanariaItemsResources(
          block.block.header.number.toNumber(),
          nfts,
          nftMintBlock
        );
      }
    });
  } catch (error) {
    console.log("SEED BASE ERROR", error);
  }
};
// seedKanariaBase();

export const pinCollectionsMetadatas = async () => {
  const metadataRaw = await fsPromises.readFile(
    `${process.cwd()}/test/seed/2.0.0/data/kanaria-tradable-collections-metadata.json`
  );
  if (!metadataRaw) {
    throw new Error("No metadata file");
  }
  const metadataRawJson = JSON.parse(metadataRaw.toString());

  const promises = metadataRawJson.map(async (metadata: { name: any }) => {
    const options = {
      ...defaultOptions,
      pinataMetadata: { name: metadata.name },
    };
    try {
      const metadataHashResult = await pinata.pinJSONToIPFS(metadata, options);
      return `ipfs://ipfs/${metadataHashResult.IpfsHash}`;
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  });

  const result = await Promise.all(promises);

  fs.writeFileSync(`collection-metadatas.json`, JSON.stringify(result));
};

const getCollections = async (): Promise<
  {
    symbol: string;
    metadata: string;
    id: string;
  }[]
> => {
  await cryptoWaitReady();

  return [
    {
      symbol: "KANBACK",
      metadata:
        "ipfs://ipfs/bafkreidipg62bpioteibhlkxkcrnajd6fhnozktkxlv2w4tqgi5nlugr7u",
      id: Collection.generateId(u8aToHex(getKeys()[0].publicKey), "KANBACK"),
    },
    {
      symbol: "KANFRNT",
      metadata:
        "ipfs://ipfs/bafkreid6dr3dgdur25o4ifrx43d2iwbw6flazmukufzl3zbajx4jfebzzu",
      id: Collection.generateId(u8aToHex(getKeys()[0].publicKey), "KANFRNT"),
    },
    {
      symbol: "KANBG",
      metadata:
        "ipfs://ipfs/bafkreid3tmlvr5bsajh5qcitl6p7loy4azszdgky6s6ldicfh55dasftge",
      id: Collection.generateId(u8aToHex(getKeys()[0].publicKey), "KANBG"),
    },
    {
      symbol: "KANCHEST",
      metadata:
        "ipfs://ipfs/bafkreigws72ruoliri3255nmyodhggz4mjk7buwsgqdnlxhexmsgjpszku",
      id: Collection.generateId(u8aToHex(getKeys()[0].publicKey), "KANCHEST"),
    },
    {
      symbol: "KANHEAD",
      metadata:
        "ipfs://ipfs/bafkreia3ezmluz7jq6jyl2lm3ijxj3xk6kvolm6adf4zad7q72gznxihxm",
      id: Collection.generateId(u8aToHex(getKeys()[0].publicKey), "KANHEAD"),
    },
    {
      symbol: "KANHAND",
      metadata:
        "ipfs://ipfs/bafkreib7xdxrao4ahoox3qxntdgjm2gxjwbngv3maqcmsacwu2n5q7earq",
      id: Collection.generateId(u8aToHex(getKeys()[0].publicKey), "KANHAND"),
    },
  ];
};

const mapCollectionIdToSymbol = {
  background: "KANBACK",
};

export const uploadRMRKMetadata = async (
  metadataFields: NFTMetadata
): Promise<string> => {
  const options = {
    ...defaultOptions,
    pinataMetadata: { name: metadataFields.name },
  };
  try {
    const metadata = { ...metadataFields };
    const metadataHashResult = await pinata.pinJSONToIPFS(metadata, options);
    return `ipfs://ipfs/${metadataHashResult.IpfsHash}`;
  } catch (error) {
    return "";
  }
};

interface MetadataRaw {
  item: string;
  emote: string;
  Rarity: string;
  type: string;
  path: string;
  shortName: string;
  fullName: string;
  Name: string;
  Description: string;
  "Attribute: context": "";
  "Attribute: type": "";
  Collection: "";
  Minted: "";
  Amount: "";
  Ready: "" | "Y";
}

export const generateKanariaMetadata = async () => {
  try {
    const metadataRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/metadata.json`
    );
    if (!metadataRaw) {
      throw new Error("No metadata file");
    }
    const metadataRawJson: MetadataRaw[] = JSON.parse(metadataRaw.toString());
    const metadataRawJsonReady = metadataRawJson.filter(
      (metadata) => metadata.Ready === "Y"
    );

    const pinnedRaw = await fsPromises.readFile(
      `${process.cwd()}/pinned-items-metadatas.json`
    );
    const pinnedRawJson = JSON.parse(pinnedRaw.toString());

    const emotesBreakdownRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/emote-resources.json`
    );

    // console.log(files);

    let matadata = metadataRawJsonReady.map((metadataRawItem) => {
      const attributes: Attribute[] = [];
      Object.keys(metadataRawItem).forEach((key) => {
        if (key.includes("Attribute:")) {
          const attributeKey = key.slice("Attribute: ".length);
          const attributeValue =
            metadataRawItem[key as keyof typeof metadataRawItem];
          attributes.push({
            trait_type: attributeKey,
            value: attributeValue,
          });
        }
      });

      return {
        id: `${metadataRawItem.item.replace(".svg", "")}`,
        slot: metadataRawItem.type,
        metadata: {
          image: `ipfs://ipfs/QmVwVkgrZd3wHn5EC1Lvmcbxvz497sw9YgDywmZaxrfXE5/${
            metadataRawItem.emote
          }/${metadataRawItem.item.replace(".svg", "_thumb.svg")}`,
          description: metadataRawItem.Description,
          name: metadataRawItem.Name,
          attributes,
        },
      };
    });

    // Filter out what is already pinned
    matadata = matadata.filter((mtd) => pinnedRawJson.findIndex(mtd?.id) < 0);

    const promises = matadata.map(async (metadataItem) => {
      const options = {
        ...defaultOptions,
        pinataMetadata: { name: metadataItem.id },
      };
      try {
        const metadata = { ...metadataItem.metadata };
        const metadataHashResult = await pinata.pinJSONToIPFS(
          metadata,
          options
        );
        return {
          ...metadataItem,
          metadata: `ipfs://ipfs/${metadataHashResult.IpfsHash}`,
        };
      } catch (error) {
        console.log(error);
        console.log(JSON.stringify(error));
        return "";
      }
    });

    const pinnedMetadata = await Promise.all(promises);
    console.log(pinnedMetadata);

    fs.writeFileSync(
      `${process.cwd()}/test/seed/2.0.0/data/pinned-items-metadatas.json`,
      JSON.stringify(pinnedMetadata.filter((mtdta) => mtdta !== ""))
    );
  } catch (error) {
    console.log(error);
  }
};
// generateKanariaMetadata();

export const seedKanariaNftItems = async () => {
  try {
    const ws = WS_URL;
    const phrase = "//Alice";
    console.log("Connecting...");
    const api = await getApi(ws);
    console.log("Connected.");

    const kp = getKeyringFromUri(phrase);
    const kp2 = getKeyringFromUri("//Bob");

    const pinnedItemsMetadataRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/pinned-items-metadatas.json`
    );
    if (!pinnedItemsMetadataRaw) {
      throw new Error("No pinnedItemsMetadata file");
    }
    const pinnedItemsMetadataRawJson: {
      id: string;
      metadata: string;
      slot: string;
    }[] = JSON.parse(pinnedItemsMetadataRaw.toString());

    const nfts: NFT[] = [];

    const promises = pinnedItemsMetadataRawJson.map((metadata, index) => {
      // @ts-ignore
      if (!mapCollectionIdToSymbol[metadata.slot]) {
        return "";
      }

      const nft = new NFT({
        block: 0,
        collection: Collection.generateId(
          u8aToHex(getKeys()[0].publicKey),
          // @ts-ignore
          mapCollectionIdToSymbol[metadata.slot]
        ),
        symbol: metadata.id,
        transferable: 1,
        sn: `${(index + 1).toString()}`.padStart(8, "0"),
        owner: encodeAddress(kp.address, 2),
        attributes: [],
      });

      nfts.push(nft);

      return nft.mint();
    });

    const remarks = await Promise.all(promises);
    console.log(remarks);
    const txs = remarks
      .filter((remark) => remark !== "")
      .map((remark) => api.tx.system.remark(remark));
    await api.tx.utility.batch(txs).signAndSend(kp, async ({ status }) => {
      if (status.isInBlock) {
        console.log(`Nested Kanaria NFT items included in ${status.asInBlock}`);
        const block = await api.rpc.chain.getBlock(status.asInBlock);
        console.log("NFT BLOCK NUMBER: ", block.block.header.number.toNumber());

        seedKanariaBase(nfts, block.block.header.number.toNumber());
      }
    });
  } catch (error) {
    console.log(JSON.stringify(error));
  }
};

// seedKanariaNftItems();

const seedKanariaItemsResources = async (
  baseBlock: number,
  nfts: NFT[],
  nftMintBlock: number
) => {
  try {
    const ws = WS_URL;
    const phrase = "//Alice";
    console.log("Connecting...");
    const api = await getApi(ws);
    console.log("Connected.");

    const kp = getKeyringFromUri(phrase);
    const kp2 = getKeyringFromUri("//Bob");

    // const consolidatedJson = []

    const emotesBreakdownRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/emote-resources.json`
    );

    const emotesBreakdownRawJson: {
      slot: string;
      resources: string[];
    }[] = JSON.parse(emotesBreakdownRaw.toString());

    const promises = nfts.map((consolidatedNft) => {
      // @ts-ignore
      if (!mapCollectionIdToSymbol["background"]) {
        return "";
      }

      const findResources = emotesBreakdownRawJson.find((emts) =>
        emts.resources.includes(`${consolidatedNft.symbol}.svg`)
      );

      if (!findResources) {
        return "";
      }

      console.log("nftMintBlock", nftMintBlock);

      const nft = new NFT({
        block: nftMintBlock,
        collection: consolidatedNft.collection,
        symbol: consolidatedNft.symbol,
        transferable: consolidatedNft.transferable,
        sn: consolidatedNft.sn,
        owner: consolidatedNft.owner,
        attributes: [],
      });

      const base = new Base(
        baseBlock,
        "KANBASE",
        encodeAddress(kp.address, 2),
        "svg",
        []
      );

      const rmrks = findResources.resources.map((res) => [
        nft.resadd({
          id: nanoid(5),
          src: `ipfs://ipfs/QmVwVkgrZd3wHn5EC1Lvmcbxvz497sw9YgDywmZaxrfXE5/${res.slice(
            0,
            res.indexOf("_")
          )}/${res}`,
        }),
        nft.resadd({
          slot: `${base.getId()}.${findResources.slot}`,
          id: nanoid(5),
          src: `ipfs://ipfs/QmeXUDt9hpoUGRdGiahLSQmf5fegUJ5Jm6fei1xnBeNuDK/${res.slice(
            0,
            res.indexOf("_")
          )}/${res}`,
        }),
      ]);
      //nft.resadd({ base: base.getId() })
      return rmrks.flat();
    });

    const remarks = await Promise.all(promises);
    console.log(remarks);
    const txs = remarks
      .filter((rmrk) => rmrk !== "")
      .flat()
      .map((remark) => api.tx.system.remark(remark));
    await api.tx.utility.batch(txs).signAndSend(kp, async ({ status }) => {
      if (status.isInBlock) {
        console.log(`Nested Kanaria NFT Resource added in ${status.asInBlock}`);
        const block = await api.rpc.chain.getBlock(status.asInBlock);
        classBlock = block.block.header.number.toNumber();
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// seedKanariaItemsResources();

const getKeyringFromUri = (phrase: string): KeyringPair => {
  const keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromUri(phrase);
};

export const seedKanariaBasCollections = async () => {
  try {
    const ws = WS_URL;
    const phrase = "//Alice";
    console.log("Connecting...");
    const api = await getApi(ws);
    console.log("Connected.");

    const kp = getKeyringFromUri(phrase);
    const kp2 = getKeyringFromUri("//Bob");

    const accounts = getKeys();
    const collections = await getCollections();
    const remarks = collections.map((collection) => {
      const Cl = new Collection(
        0,
        0,
        encodeAddress(accounts[0].address, 2),
        collection.symbol,
        collection.id,
        collection.metadata
      );
      return Cl.create();
    });

    const txs = remarks.map((remark) => api.tx.system.remark(remark));
    await api.tx.utility.batch(txs).signAndSend(kp, async ({ status }) => {
      if (status.isInBlock) {
        console.log(`included in ${status.asInBlock}`);
        const block = await api.rpc.chain.getBlock(status.asInBlock);
        classBlock = block.block.header.number.toNumber();

        seedKanariaNftItems();
      }
    });
  } catch (error) {
    console.log("SEED COLLECTIONS ERROR", error);
  }
};

seedKanariaBasCollections();

// export class Seeder {
//   api: ApiPromise;
//   accounts: KeyringPair[];
//   kp: KeyringPair;
//   kp2: KeyringPair;
//   baseId?: string;
//   readonly symbol: string;
//   readonly classId: string;
//   readonly partsClassId: string;
//   readonly partsSymbol: string;
//   constructor(api: ApiPromise, kp: KeyringPair, kp2: KeyringPair) {
//     this.api = api;
//     this.accounts = getKeys();
//     this.kp = kp;
//     this.kp2 = kp2;
//     this.symbol = "KANARIAS";
//     this.classId = Collection.generateId(
//       u8aToHex(getKeys()[0].publicKey),
//       "KANARIAS"
//     );
//     this.partsSymbol = "KANARIAPARTS";
//     this.partsClassId = Collection.generateId(
//       u8aToHex(getKeys()[0].publicKey),
//       "KANARIAPARTS"
//     );
//     this.baseId = undefined;
//   }
//
//   public async seedCollection(): Promise<number> {
//     return 0;
//   }
//
//   public async seedNfts(coll: string): Promise<number> {
//     return 0;
//   }
//
//   public async seedEmotes(coll: string, amount: number): Promise<number> {
//     return 0;
//   }
//
//   /*
//     Mint base kanaria class which will hold all of Kanaria initial NFTs, 1 Base for Bird 777 and 1 NFT bird container number 777
//    */
//   public async seedBase(): Promise<number> {
//     const remarks: string[] = [];
//
//     // const collection = new Collection(
//     //   0,
//     //   0,
//     //   encodeAddress(this.accounts[0].address, 2),
//     //   this.symbol,
//     //   this.classId,
//     //   "https://some.url"
//     // );
//     // remarks.push(collection.create());
//     //
//     // const kanariaPartsCollection = new Collection(
//     //   0,
//     //   0,
//     //   encodeAddress(this.accounts[0].address, 2),
//     //   this.partsSymbol,
//     //   this.partsClassId,
//     //   "https://some.url"
//     // );
//     // remarks.push(kanariaPartsCollection.create());
//     //
//     const base = new Base(
//       13,
//       "KBASE777",
//       encodeAddress(this.accounts[0].address, 2),
//       "svg",
//       getBaseParts([this.partsClassId])
//     );
//
//     remarks.push(
//       base.equippable({
//         slot: "gemslot2",
//         operator: "+",
//         collections: ["d43593c715a56da27d-KANARIAPARTS2"],
//       })
//     );
//     const nft1 = new NFT({
//       block: 16,
//       collection: "d43593c715a56da27d-KANARIAPARTS2",
//       symbol: "GEM2",
//       transferable: 1,
//       sn: "2".padStart(16, "0"),
//       owner: encodeAddress(this.accounts[0].address, 2),
//     });
//     remarks.push(nft1.equip("base-13-KBASE777.gemslot2"));
//
//     // const nft1 = new NFT({
//     //   block: 13,
//     //   collection: "d43593c715a56da27d-KANARIAS",
//     //   symbol: "KANR",
//     //   transferable: 1,
//     //   sn: "777".padStart(16, "0"),
//     //   owner: encodeAddress(this.accounts[0].address, 2),
//     // });
//     // remarks.push(
//     //   nft1.accept(
//     //     "16-d43593c715a56da27d-KANARIAPARTS2-GEM2-0000000000000002",
//     //     "nft"
//     //   )
//     // );
//     //
//     // const nft2 = new NFT({
//     //   block: 16,
//     //   collection: "d43593c715a56da27d-KANARIAPARTS2",
//     //   symbol: "GEM2",
//     //   transferable: 1,
//     //   sn: "2".padStart(16, "0"),
//     //   owner: encodeAddress(this.accounts[0].address, 2),
//     // });
//     // remarks.push(
//     //   nft2.accept("94df2d24-2b38-4a44-a86a-412b59af7dc6", "resource")
//     // );
//
//     const txs = remarks.map((remark) => this.api.tx.system.remark(remark));
//     await this.api.tx.utility
//       .batch(txs)
//       .signAndSend(this.kp, async ({ status }) => {
//         if (status.isInBlock) {
//           const block = await this.api.rpc.chain.getBlock(status.asInBlock);
//
//           console.log(`included in ${status.asInBlock}`);
//           // classBlock = block.block.header.number.toNumber();
//           // nftBlock = block.block.header.number.toNumber();
//           // baseBlock = block.block.header.number.toNumber();
//           //
//           // const baseInBlock = new Base(
//           //   baseBlock,
//           //   "KBASE777",
//           //   encodeAddress(this.accounts[0].address, 2),
//           //   "svg",
//           //   getBaseParts(this.partsClassId)
//           // );
//           //
//           // this.baseId = baseInBlock.getId();
//           //
//           // this.sendBaseToBird();
//         }
//       });
//
//     await sleep(50000);
//
//     return 0;
//   }
//
//   /*
//     Testing resadd and accept interactions
//    */
//   public async seedAndAccept(): Promise<number> {
//     const remarks: string[] = [];
//
//     const kanariaPartsCollection = new Collection(
//       0,
//       0,
//       encodeAddress(this.accounts[1].address, 2),
//       `${this.partsSymbol}2`,
//       `${this.partsClassId}2`,
//       "https://some.url"
//     );
//     remarks.push(kanariaPartsCollection.create());
//
//     const nftParent = new NFT({
//       block: nftBlock,
//       collection: this.classId,
//       symbol: "KANR",
//       transferable: 1,
//       sn: "777".padStart(16, "0"),
//       owner: encodeAddress(this.accounts[0].address, 2),
//     });
//
//     const nft1 = new NFT({
//       block: 0,
//       collection: `${this.partsClassId}2`,
//       symbol: "GEM2",
//       transferable: 1,
//       sn: "2".padStart(16, "0"),
//       owner: encodeAddress(this.accounts[2].address, 2),
//     });
//     remarks.push(nft1.mint(nftParent.getId()));
//
//     const nft2 = new NFT({
//       block: 0,
//       collection: `${this.partsClassId}2`,
//       symbol: "GEM3",
//       transferable: 1,
//       sn: "3".padStart(16, "0"),
//       owner: encodeAddress(this.accounts[2].address, 2),
//     });
//
//     remarks.push(nft2.mint(encodeAddress(this.accounts[1].address, 2)));
//
//     const txs = remarks.map((remark) => this.api.tx.system.remark(remark));
//     await this.api.tx.utility
//       .batch(txs)
//       .signAndSend(this.kp2, async ({ status }) => {
//         if (status.isInBlock) {
//           console.log(`included in ${status.asInBlock}`);
//
//           const block = await this.api.rpc.chain.getBlock(status.asInBlock);
//
//           console.log(`included in ${status.asInBlock}`);
//           const nftMinted = new NFT({
//             block: block.block.header.number.toNumber(),
//             collection: `${this.partsClassId}2`,
//             symbol: "GEM2",
//             transferable: 1,
//             sn: `2`.padStart(16, "0"),
//             owner: encodeAddress(this.accounts[2].address, 2),
//           });
//
//           const remark = this.api.tx.system.remark(
//             nftMinted.resadd({
//               media: "ipfs://ipfs/test",
//               metadata: "ipfs://ipfs/test",
//             })
//           );
//
//           await this.api.tx.utility
//             .batch([remark])
//             .signAndSend(this.kp2, async ({ status }) => {
//               if (status.isInBlock) {
//                 console.log(`included in ${status.asInBlock}`);
//               }
//             });
//         }
//       });
//
//     await sleep(10000);
//
//     return 0;
//   }
//
//   /**
//    Send Base to Kanaria bird
//    */
//   public async sendBaseToBird(): Promise<number> {
//     const remarks: string[] = [];
//
//     const nftParent = new NFT({
//       block: nftBlock,
//       collection: this.classId,
//       symbol: "KANR",
//       transferable: 1,
//       sn: "777".padStart(16, "0"),
//       owner: encodeAddress(this.accounts[0].address, 2),
//     });
//
//     remarks.push(nftParent.resadd({ base: this.baseId }));
//
//     const backgroundNft = new NFT({
//       block: 0,
//       collection: this.partsClassId,
//       symbol: "KANRBG",
//       transferable: 1,
//       sn: `1`.padStart(16, "0"),
//       owner: nftParent.getId(),
//     });
//
//     remarks.push(backgroundNft.mint(nftParent.getId()));
//
//     // const equippable1 = new Equippable(
//     //   `base-${baseBlock}-base1`,
//     //   "gemslot2",
//     //   `+${this.partsClassId}`
//     // );
//
//     const gem2Nft = new NFT({
//       block: 0,
//       collection: this.partsClassId,
//       symbol: "KANRGEM2",
//       transferable: 1,
//       sn: `2`.padStart(16, "0"),
//       owner: encodeAddress(this.accounts[0].address, 2),
//     });
//
//     remarks.push(gem2Nft.mint());
//
//     const txs = remarks.map((remark) => this.api.tx.system.remark(remark));
//     await this.api.tx.utility
//       .batch(txs)
//       .signAndSend(this.kp, async ({ status }) => {
//         if (status.isInBlock) {
//           console.log(`included in ${status.asInBlock}`);
//
//           const block = await this.api.rpc.chain.getBlock(status.asInBlock);
//
//           const gem2NftMinted = new NFT({
//             block: block.block.header.number.toNumber(),
//             collection: this.partsClassId,
//             symbol: "KANRGEM2",
//             transferable: 1,
//             sn: `2`.padStart(16, "0"),
//             owner: encodeAddress(this.accounts[0].address, 2),
//           });
//
//           await this.api.tx.utility
//             .batch([
//               this.api.tx.system.remark(gem2NftMinted.send(nftParent.getId())),
//             ])
//             .signAndSend(this.kp, async ({ status }) => {
//               if (status.isInBlock) {
//                 console.log(`included in ${status.asInBlock}`);
//                 console.log("I AM HERE");
//                 this.seedAndAccept();
//               }
//             });
//         }
//       });
//
//     await sleep(10000);
//
//     return 0;
//   }
// }

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};
