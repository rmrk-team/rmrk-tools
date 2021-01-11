import { Collection } from "../../../src/rmrk1.0.0/classes/collection";
import { NFT } from "../../../src/rmrk1.0.0/classes/nft";
import { u8aToHex } from "@polkadot/util";
import getKeys from "../devaccs";

export default function defineSeeds(): any[] {
  const accounts = getKeys();

  const s = [];

  const c1 = new Collection(
    0,
    "Foo",
    5,
    accounts[0].address,
    "FOO",
    Collection.generateId(u8aToHex(accounts[0].publicKey), "FOO"),
    "https://some.url"
  );

  const c2 = new Collection(
    0,
    "Bar",
    5,
    accounts[0].address,
    "BAR",
    Collection.generateId(u8aToHex(accounts[0].publicKey), "BAR"),
    "https://some.url"
  );

  s.push([c1.mint(), accounts[0], `Deploy collection 1: ${c1.name}`]);
  s.push([c2.mint(), accounts[0], `Deploy collection 2: ${c2.name}`]);
  s.push(5000);

  // Load now minted collection c2 as c2b
  const c2b = new Collection(
    1, //block.block.header.number.toNumber(), <= @todo, problem. Block number unfetchable here.
    "Bar",
    5,
    accounts[0].address,
    "BAR",
    Collection.generateId(u8aToHex(accounts[0].publicKey), "BAR"),
    "https://some.url"
  );

  s.push([
    c2b.change_issuer(accounts[1].address),
    accounts[0],
    `Change owner of collection ${c2b.name} from ${c2b.issuer} to ${accounts[1].address}`,
  ]);

  return s;
}
