import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { u8aToHex } from "@polkadot/util";
import { encodeAddress, decodeAddress } from "@polkadot/util-crypto";
import getKeys from "./devaccs";
import * as fs from "fs";
import { Collection } from "../../src/rmrk1.0.0/classes/collection";
import { NFT } from "../../src/rmrk1.0.0/classes/nft";
import { Emote } from "../../src/rmrk1.0.0/classes/emote";
import * as IPFS from "ipfs-core";
import { getRandomInt } from "../../src/tools/utils";

import JsonAdapter from "../../src/tools/consolidator/adapters/json";
import { Consolidator } from "../../src/tools/consolidator/consolidator";
export class Seeder {
  api: ApiPromise;
  accounts: KeyringPair[];
  constructor(api: ApiPromise) {
    this.api = api;
    this.accounts = getKeys();
  }

  public async eggmote(): Promise<void> {
    // get a list of emote candidates
    const emojiRanges = [
      [0x1f601, 0x1f64f],
      [0x2702, 0x27b0],
      [0x1f680, 0x1f6c0],
      [0x1f170, 0x1f251],
    ];
    const fullemoji = [];
    for (const range of emojiRanges) {
      for (let i = range[0]; i <= range[1]; i++) {
        fullemoji.push(i.toString(16));
      }
    }

    console.log("Built emoji list");

    let n = 10000;

    const selectedEmotes = [];
    for (let i = 0; i < n; i++) {
      selectedEmotes.push(fullemoji[getRandomInt(0, fullemoji.length)]);
    }

    console.log("Selected emoji to apply, total of " + selectedEmotes.length);

    const rawdata = fs.readFileSync("consolidated-from-dump-with-eggs.json");
    const consolidated = JSON.parse(rawdata.toString());
    console.log(`There are ${consolidated.nfts.length} NFTs`);

    const emotesPerUser = Math.round(n / 7);
    // we iterate through 7 unlocked keys
    for (let i = 0; i < 7; i++) {
      console.log("Processing account " + i);
      const remarks: string[] = [];
      let localEmotes = emotesPerUser;
      while (localEmotes--) {
        const unicodeIndex = getRandomInt(0, selectedEmotes.length);
        const nftIndex = getRandomInt(0, consolidated.nfts.length);

        const nft = consolidated.nfts[nftIndex];
        const n = new NFT(
          nft.block,
          nft.collection,
          nft.name,
          nft.instance,
          nft.transferable,
          nft.sn,
          nft.metadata
        );
        const e = n.emote(selectedEmotes[unicodeIndex]);
        remarks.push(e);
        selectedEmotes.splice(unicodeIndex, 1);
      }
      console.log(remarks);
      // Submit these remarks by this user
      const txs = [];
      for (const remark of remarks) {
        txs.push(this.api.tx.system.remark(remark));
      }
      await this.api.tx.utility
        .batch(txs)
        .signAndSend(this.accounts[i], ({ status }) => {
          if (status.isInBlock) {
            console.log(`included in ${status.asInBlock}`);
          }
        });
    }

    // pick a random emote per number out of the candidates
    // bulk-apply
  }

  public async egglister(): Promise<void> {
    let listingAccount = this.accounts[0];
    let decoded = decodeAddress(listingAccount.address);
    let address = encodeAddress(decoded, 0);

    // Find all egg IDs
    const ja = new JsonAdapter("dump-with-eggs.json");
    const con = new Consolidator(ja);
    const consolidated = con.consolidate();

    const remarks = [];
    for (const nft of consolidated.nfts) {
      if (nft.collection.endsWith("KANARIA")) {
        // @todo switch to real ID in production just as a safety precaution
        if (BigInt(nft.sn) >= BigInt(100))
          remarks.push(nft.list(1000000000000));
      }
    }

    const txs = [];
    let i = 0;
    for (const remark of remarks) {
      //if (i > 100) break; // throttler
      txs.push(this.api.tx.system.remark(remark));
      i++;
    }
    await this.api.tx.utility
      .batch(txs)
      .signAndSend(listingAccount, ({ status }) => {
        if (status.isInBlock) {
          console.log(`included in ${status.asInBlock}`);
        }
      });
  }

  /**
   * Seeds the chain with a collection of egg NFTs and 10000 instances from the \\Alice account
   */
  public async eggmachine(): Promise<void> {
    let mintingAccount = this.accounts[0];
    let decoded = decodeAddress(mintingAccount.address);
    let address = encodeAddress(decoded, 0);

    const collectionMetadata = {
      description:
        "🥚 Kanaria RMRK eggs, collectible, hatchable canary eggs 🐣",
      attributes: [],
      external_url: "https://kanaria.rmrk.app",
      image: "ipfs://ipfs/QmRjZHoSycKbYLGBbG6qJ1GKe1kVbYbpe86AyfUTvyDda7",
    };

    const nftFounderMetadata = {
      external_url: "https://kanaria.rmrk.app",
      image: "ipfs://ipfs/QmfTZPef7QN4EPdUgkjio5RT5qhfBLWr7HNx1tXuKzwoXV",
      description: "Founder eggs: the first 99 eggs in the set",
      name: "Kanaria Founder eggs",
      background_color: "ffffff",
    };

    const nftCommonMetadata = {
      external_url: "https://kanaria.rmrk.app",
      image: "ipfs://ipfs/QmbzKmkvecTLrHQTZpFhdmJwYxRiBHEKRaWE25cAe7XWbe",
      description: "Common eggs: 9900 eggs to hatch into Kusama canaries",
      name: "Kanaria eggs",
      background_color: "ffffff",
    };

    // Initialize IPFS node
    const node = await IPFS.create();
    const version = await node.version();
    console.log("IPFS Version:", version.version);
    // Upload all metadata to IPFS
    const collMdHash = (
      await node.add({
        path: "img.svg",
        content: JSON.stringify(collectionMetadata),
      })
    ).cid;
    console.log(`Collection metadata: ${collMdHash}`);
    const nftMdHash = (
      await node.add({
        path: "img.svg",
        content: JSON.stringify(nftCommonMetadata),
      })
    ).cid;
    console.log(`Common metadata: ${nftMdHash}`);
    const founderMdHash = (
      await node.add({
        path: "img.svg",
        content: JSON.stringify(nftFounderMetadata),
      })
    ).cid;
    console.log(`Founder metadata: ${founderMdHash}`);

    const remarks = [];
    // Create collection
    const collectionSymbol = "KANARIA";
    const collectionId = Collection.generateId(
      u8aToHex(this.accounts[0].publicKey),
      "KANARIA"
    );
    const eggCollection = new Collection(
      0,
      "Kanaria Eggs",
      10000,
      address,
      collectionSymbol,
      collectionId,
      `ipfs://ipfs/${collMdHash}`
    );

    remarks.push(eggCollection.mint());
    for (let i = 1; i < 10000; i++) {
      if (i < 10) {
        // Super Founder mode
        const nft = new NFT(
          0,
          collectionId,
          "Super Founder Kanaria egg",
          "KANSUPER",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/${founderMdHash}`
        );
        remarks.push(nft.mintnft());
      } else if (i < 100) {
        // Founder
        const nft = new NFT(
          0,
          collectionId,
          "Founder Kanaria egg",
          "KANFOUNDER",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/${founderMdHash}`
        );
        remarks.push(nft.mintnft());
      } else {
        // Common
        const nft = new NFT(
          0,
          collectionId,
          "Kanaria egg",
          "KANCOMMON",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/${nftMdHash}`
        );
        remarks.push(nft.mintnft());
      }
    }

    const txs = [];
    let i = 0;
    for (const remark of remarks) {
      //if (i > 100) break; // throttler
      txs.push(this.api.tx.system.remark(remark));
      i++;
    }

    await this.api.tx.utility
      .batch(txs)
      .signAndSend(this.accounts[0], ({ status }) => {
        if (status.isInBlock) {
          console.log(`included in ${status.asInBlock}`);
        }
      });
  }

  /**
   * @param folder Folder in which to look for seed files
   * @returns Number of imported seeds
   */
  public async seedFromFolder(folder: string): Promise<number> {
    // Alice creates 2 collections and then transfers ownership of one to Bob.

    const c1 = new Collection(
      0,
      "Foo",
      5,
      this.accounts[0].address,
      "FOO",
      Collection.generateId(u8aToHex(this.accounts[0].publicKey), "FOO"),
      "https://some.url"
    );

    const c2 = new Collection(
      0,
      "Bar",
      5,
      this.accounts[0].address,
      "BAR",
      Collection.generateId(u8aToHex(this.accounts[0].publicKey), "BAR"),
      "https://some.url"
    );

    console.log("Deploying collection 1");
    await this.api.tx.system.remark(c1.mint()).signAndSend(this.accounts[0]);

    console.log("Deploying collection 2");
    const unsub = await this.api.tx.system
      .remark(c2.mint())
      .signAndSend(this.accounts[0], { nonce: -1 }, async (result) => {
        if (result.status.isInBlock) {
          const block = await this.api.rpc.chain.getBlock(
            result.status.asInBlock
          );

          console.log("In block number " + block.block.header.number);
          unsub();

          // To change ownership, we need to load the
          // deployed collection from the chain into a new instance

          const c2b = new Collection(
            block.block.header.number.toNumber(),
            "Bar",
            5,
            this.accounts[0].address,
            "BAR",
            Collection.generateId(u8aToHex(this.accounts[0].publicKey), "BAR"),
            "https://some.url"
          );

          await this.api.tx.system
            .remark(c2b.change_issuer(this.accounts[1].address))
            .signAndSend(this.accounts[0], { nonce: -1 }, async (result) => {
              if (result.status.isInBlock) {
                const block = await this.api.rpc.chain.getBlock(
                  result.status.asInBlock
                );
                console.log("In block number " + block.block.header.number);
              }
            });
        }
      });

    const c3 = new Collection(
      0,
      "Test Batch",
      5,
      this.accounts[0].address,
      "TB",
      Collection.generateId(u8aToHex(this.accounts[0].publicKey), "TB"),
      "https://some.url"
    );
    await this.api.tx.utility
      .batchAll([
        this.api.tx.system.remark(c3.mint()),
        this.api.tx.system.remark("foo"),
      ])
      .signAndSend(this.accounts[2], { nonce: -1 });

    const c4 = new Collection(
      0,
      "Test Batch 2",
      5,
      this.accounts[0].address,
      "TB2",
      Collection.generateId(u8aToHex(this.accounts[0].publicKey), "TB2"),
      "https://some.url"
    );

    const c5 = new Collection(
      0,
      "Test Batch 3",
      5,
      this.accounts[0].address,
      "TB3",
      Collection.generateId(u8aToHex(this.accounts[0].publicKey), "TB3"),
      "https://some.url"
    );

    await this.api.tx.utility
      .batchAll([
        this.api.tx.system.remark(c4.mint()),
        this.api.tx.system.remark(c5.mint()),
      ])
      .signAndSend(this.accounts[1], { nonce: -1 });

    await sleep(10000);

    // @todo
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    //fs.readdirSync(folder).forEach((file) => {
    //console.log("Seeding from " + folder + "/" + file);
    //});
    return 0;
  }
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};
