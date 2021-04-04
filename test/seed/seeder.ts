import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { u8aToHex } from "@polkadot/util";
import { encodeAddress, decodeAddress } from "@polkadot/util-crypto";
import getKeys from "./devaccs";
import { Collection } from "../../src/rmrk1.0.0/classes/collection";
import { NFT } from "../../src/rmrk1.0.0/classes/nft";

export class Seeder {
  api: ApiPromise;
  accounts: KeyringPair[];
  kp: KeyringPair;
  constructor(api: ApiPromise, kp: KeyringPair) {
    this.api = api;
    this.accounts = getKeys();
    this.kp = kp;
  }

  public async seedAll(): Promise<string[]> {
    const systemProperties = await this.api.rpc.system.properties();
    const { ss58Format: chainSs58Format } = systemProperties.toHuman();
    const ss58 = (chainSs58Format as number) || 2;
    const address = encodeAddress(decodeAddress(this.kp.address), ss58);
    const remarks: string[] = [];
    const collectionSymbol = "KAN";
    const collectionId = Collection.generateId(
      u8aToHex(this.kp.publicKey),
      "KAN"
    );
    const collection = new Collection(
      0,
      "Limited Edition Hatchable Egg NFTs on RMRK",
      10000,
      address,
      collectionSymbol,
      collectionId,
      `ipfs://ipfs/bafkreiftupazt3tmgcdkbpq62b5n5sr77qv6pspxy7cyjm35r75mfknrpm`
    );
    remarks.push(collection.mint());

    for (let i = 1; i < 10000; i++) {
      let nft: NFT;
      if (i < 10) {
        // Super Founder mode
        nft = new NFT(
          0,
          collectionId,
          "Super Founder Kanaria egg",
          "KANS",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/bafkreigp3amcrr5urzntlyjpsvjccye4u7dvtyeatmlgzgecpy2kaczhka`
        );
      } else if (i < 100) {
        // Founder mode
        nft = new NFT(
          0,
          collectionId,
          "Founder Kanaria egg",
          "KANF",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/bafkreibsgabyifzynjqrcmdj3m4gjv2jfmohzzdq2xe7gc3lgkyp4yunpq`
        );
      } else if (i < 1000) {
        // Rare
        nft = new NFT(
          0,
          collectionId,
          "Rare Kanaria egg",
          "KANR",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/bafkreicdj3qnf2m6pwighaxuk3qaif55ud2lih6nwwvs6bdpoee4r75eva`
        );
      } else {
        // Limited
        nft = new NFT(
          0,
          collectionId,
          "Limited Edition Kanaria Egg",
          "KANL",
          1,
          `${i}`.padStart(16, "0"),
          `ipfs://ipfs/bafkreigwoatvru5hntu5vx3a6njjanunrgefqnke6qosa4mkk5xu5nkw2q`
        );
      }
      remarks.push(nft.mintnft());
    }
    return remarks;
  }

  public async issueRemarks(remarks: string[], from?: number, to?: number) {
    if (!from) {
      from = 0;
    }
    if (!to) {
      to = remarks.length - 1;
    }
    let txs = [];
    for (let i = from; i <= to; i++) {
      if (undefined !== remarks[i]) {
        txs.push(this.api.tx.system.remark(remarks[i]));
      }
    }
    await this.api.tx.utility.batch(txs).signAndSend(this.kp, ({ status }) => {
      if (status.isInBlock) {
        console.log(`included in ${status.asInBlock}`);
      }
    });
  }

  public async seedNfts(coll: string): Promise<number> {
    return 0;
  }

  public async seedEmotes(coll: string, amount: number): Promise<number> {
    return 0;
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
