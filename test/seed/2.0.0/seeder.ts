import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { u8aToHex } from "@polkadot/util";
import getKeys from "../devaccs";
import * as fs from "fs";
import { NftClass } from "../../../src/rmrk2.0.0/classes/nft-class";
import { NFT } from "../../../src/rmrk2.0.0";
import { Base, IBasePart } from "../../../src/rmrk2.0.0/classes/base";
import { Equippable } from "../../../src/rmrk2.0.0/classes/equippable";
import { encodeAddress } from "@polkadot/keyring";

const getBaseParts = (classId: string) => {
  const BIRD_1_BASE_PARTS: IBasePart[] = [
    {
      id: "background",
      type: "slot",
      equippable: [classId],
      z: 0,
    },
    {
      id: "backpack",
      type: "slot",
      equippable: [classId],
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
      type: "slot",
      equippable: [classId],
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
      equippable: [classId],
      z: 12,
    },
    {
      id: "headwear",
      type: "slot",
      equippable: [classId],
      z: 13,
    },
    {
      id: "objectleft",
      type: "slot",
      equippable: [classId],
      z: 14,
    },
    {
      id: "objectright",
      type: "slot",
      equippable: [classId],
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
      equippable: [classId],
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
      equippable: [classId],
      z: 91,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_02_openslot.svg",
    },
    {
      id: "gemslot3",
      type: "slot",
      equippable: [classId],
      z: 92,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_03_openslot.svg",
    },
    {
      id: "gemslot4",
      type: "slot",
      equippable: [classId],
      z: 92,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_04_openslot.svg",
    },
    {
      id: "gemslot5",
      type: "slot",
      equippable: [classId],
      z: 92,
      src:
        "ipfs://ipfs/QmSFkuSVnGLdBiT4s6NU5UZCSxpHWdExEMMgtic97j2dpT/gem_05_openslot.svg",
    },
  ];

  return BIRD_1_BASE_PARTS;
};

let classBlock = 0;
let nftBlock = 0;
let baseBlock = 0;

export class Seeder {
  api: ApiPromise;
  accounts: KeyringPair[];
  kp: KeyringPair;
  baseId?: string;
  readonly symbol: string;
  readonly classId: string;
  readonly partsClassId: string;
  readonly partsSymbol: string;
  constructor(api: ApiPromise, kp: KeyringPair) {
    this.api = api;
    this.accounts = getKeys();
    this.kp = kp;
    this.symbol = "KANARIAS";
    this.classId = NftClass.generateId(
      u8aToHex(getKeys()[0].publicKey),
      "KANARIAS"
    );
    this.partsSymbol = "KANARIAPARTS";
    this.partsClassId = NftClass.generateId(
      u8aToHex(getKeys()[0].publicKey),
      "KANARIAPARTS"
    );
    this.baseId = undefined;
  }

  public async seedCollection(): Promise<number> {
    return 0;
  }

  public async seedNfts(coll: string): Promise<number> {
    return 0;
  }

  public async seedEmotes(coll: string, amount: number): Promise<number> {
    return 0;
  }

  /*
    Mint base kanaria class which will hold all of Kanaria initial NFTs, 1 Base for Bird 777 and 1 NFT bird container number 777
   */
  public async seedBase(): Promise<number> {
    const remarks: string[] = [];

    const collection = new NftClass(
      0,
      0,
      encodeAddress(this.accounts[0].address, 2),
      this.symbol,
      this.classId,
      "https://some.url"
    );
    remarks.push(collection.create());

    const kanariaPartsCollection = new NftClass(
      0,
      0,
      encodeAddress(this.accounts[0].address, 2),
      this.partsSymbol,
      this.partsClassId,
      "https://some.url"
    );
    remarks.push(kanariaPartsCollection.create());

    const base = new Base(
      0,
      "KBASE777",
      encodeAddress(this.accounts[0].address, 2),
      "svg",
      getBaseParts(this.partsClassId)
    );

    remarks.push(base.base());

    const nft1 = new NFT({
      block: 0,
      nftclass: collection.id,
      symbol: "KANR",
      transferable: 1,
      sn: "777".padStart(16, "0"),
      owner: encodeAddress(this.accounts[0].address, 2),
    });
    remarks.push(nft1.mint());

    const txs = remarks.map((remark) => this.api.tx.system.remark(remark));
    await this.api.tx.utility
      .batch(txs)
      .signAndSend(this.kp, async ({ status }) => {
        if (status.isInBlock) {
          const block = await this.api.rpc.chain.getBlock(status.asInBlock);

          console.log(`included in ${status.asInBlock}`);
          classBlock = block.block.header.number.toNumber();
          nftBlock = block.block.header.number.toNumber();
          baseBlock = block.block.header.number.toNumber();

          const baseInBlock = new Base(
            baseBlock,
            "KBASE777",
            encodeAddress(this.accounts[0].address, 2),
            "svg",
            getBaseParts(this.partsClassId)
          );

          this.baseId = baseInBlock.getId();

          this.sendBaseToBird();
        }
      });

    await sleep(10000);

    return 0;
  }

  /**
   Send Base to Kanaria bird
   */
  public async sendBaseToBird(): Promise<number> {
    const remarks: string[] = [];

    const nftParent = new NFT({
      block: nftBlock,
      nftclass: this.classId,
      symbol: "KANR",
      transferable: 1,
      sn: "777".padStart(16, "0"),
      owner: encodeAddress(this.accounts[0].address, 2),
    });

    remarks.push(nftParent.resadd({ base: this.baseId }));

    const backgroundNft = new NFT({
      block: 0,
      nftclass: this.partsClassId,
      symbol: "KANRBG",
      transferable: 1,
      sn: `1`.padStart(16, "0"),
      owner: nftParent.getId(),
    });

    remarks.push(backgroundNft.mint(nftParent.getId()));

    // const equippable1 = new Equippable(
    //   `base-${baseBlock}-base1`,
    //   "gemslot2",
    //   `+${this.partsClassId}`
    // );

    const gem2Nft = new NFT({
      block: 0,
      nftclass: this.partsClassId,
      symbol: "KANRGEM2",
      transferable: 1,
      sn: `2`.padStart(16, "0"),
      owner: encodeAddress(this.accounts[0].address, 2),
    });

    remarks.push(gem2Nft.mint());

    const txs = remarks.map((remark) => this.api.tx.system.remark(remark));
    await this.api.tx.utility
      .batch(txs)
      .signAndSend(this.kp, async ({ status }) => {
        if (status.isInBlock) {
          console.log(`included in ${status.asInBlock}`);

          const block = await this.api.rpc.chain.getBlock(status.asInBlock);

          const gem2NftMinted = new NFT({
            block: block.block.header.number.toNumber(),
            nftclass: this.partsClassId,
            symbol: "KANRGEM2",
            transferable: 1,
            sn: `2`.padStart(16, "0"),
            owner: encodeAddress(this.accounts[0].address, 2),
          });

          await this.api.tx.utility
            .batch([
              this.api.tx.system.remark(gem2NftMinted.send(nftParent.getId())),
            ])
            .signAndSend(this.kp, async ({ status }) => {
              if (status.isInBlock) {
                console.log(`included in ${status.asInBlock}`);
              }
            });
        }
      });

    await sleep(10000);

    return 0;
  }
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};
