import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { u8aToHex } from "@polkadot/util";
import getKeys from "./devaccs";
import * as fs from "fs";
import { Collection } from "../../src/rmrk1.0.0/classes/collection";

export class Seeder {
  api: ApiPromise;
  accounts: KeyringPair[];
  kp: KeyringPair;
  constructor(api: ApiPromise, kp: KeyringPair) {
    this.api = api;
    this.accounts = getKeys();
    this.kp = kp;
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
