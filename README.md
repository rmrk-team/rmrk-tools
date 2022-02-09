# RMRK Tools

Typescript implementation of the [RMRK spec](https://github.com/Swader/rmrk-spec/) using Substrate's `system.remark` extrinsics.

Note that there are also [EVM](https://github.com/rmrk-team/evm) and [Substrate pallet](https://github.com/rmrk-team/rmrk-substrate) implementations of [RMRK spec](https://github.com/rmrk-team/rmrk-spec)

![Tests](https://github.com/Swader/rmrk-tools/actions/workflows/run-tests.yml/badge.svg)

## Installation

> Note: NodeJS 14+ is required. Please install with [NVM](https://nvm.sh).

```bash 
yarn add rmrk-tools
```

## Usage

### ESM / Typescript

#### Fetch Manually and consolidate

```js
import { fetchRemarks, getRemarksFromBlocks, getLatestFinalizedBlock, Consolidator } from 'rmrk-tools';
import { ApiPromise, WsProvider } from '@polkadot/api';

const wsProvider = new WsProvider('wss://node.rmrk.app');

const fetchAndConsolidate = async () => {
    try {
        const api = await ApiPromise.create({ provider: wsProvider });
        const to = await getLatestFinalizedBlock(api);

        const remarkBlocks = await fetchRemarks(api, 6431422, to, ['']);
        if (remarkBlocks && !isEmpty(remarkBlocks)) {
          const remarks = getRemarksFromBlocks(remarkBlocks);
          const consolidator = new Consolidator();
          const { nfts, collections } = consolidator.consolidate(remarks);
          console.log('Consolidated nfts:', nfts);
          console.log('Consolidated collections:', collections);
        }
    } catch (error) {
        console.log(error)
    }
}
```

### Browser

```html
<script src="node_modules/rmrk-tools"></script>
<script>
    const { Collection, NFT, Consolidator, fetchRemarks } = window.rmrkTools;
</script>
```

### CLI

You can use this package as a CLI tool
`npm install --save-dev rmrk-tools@latest`

Now you can use rmrk-tools coomands in your bash or npm scripts:
You can use any of the available [Helper Tools](#helper-tools) by prepending `rmrk-tools-`

```json
"scripts": {
  "fetch": "rmrk-tools-fetch",
  "consolidate": "rmrk-tools-consolidate",
  "seed": "rmrk-tools-seed",
},
```

Or in bash scripts

```node
#! /usr/bin/env node
import shell from "shelljs";

shell.exec(
  'rmrk-tools-fetch --ws wss://node.rmrk.app --prefixes=0x726d726b,0x524d524b --append=dumps/latest.json',
);
```

## API

### `Consolidator`

```js
import { Consolidator } from 'rmrk-tools';

const consolidator = new Consolidator();
const { nfts, collections } = consolidator.consolidate(remarks);
```

### `RemarkListener`

Subscribe to new Remarks

```js
import { RemarkListener } from 'rmrk-tools';
import { WsProvider } from "@polkadot/api";

const wsProvider = new WsProvider("wss://node.rmrk.app");
const api = ApiPromise.create({ provider: wsProvider });

const consolidateFunction = async (remarks: Remark[]) => {
    const consolidator = new Consolidator();
    return consolidator.consolidate(remarks);
};
  
const startListening = async () => {
  const listener = new RemarkListener({ polkadotApi: api, prefixes: [], consolidateFunction });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));
};

startListening();
```

if you want to subscribe to remarks that are included in unfinilised blocks to react to them quickly, you can use:

```js
const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
unfinilisedSubscriber.subscribe((val) => console.log('Unfinalised remarks:', val));
```

By default Listener uses localstorage to save latest block number and default key it uses is `latestBlock`

You can pass `storageKey` to listener initialisation to change localstorage key or you can pass your own implementation of `storageProvider` as long as it adhers to following interface

```js
interface IStorageProvider {
  readonly storageKey: string;
  set(latestBlock: number): Promise<void>;
  get(): Promise<string | null>;
}
```

### `Collection`

```js
import { Collection } from 'rmrk-tools';
```

Turn a remark into a collection object

```js
Collection.fromRemark(remark)
```

Create new collecton

```js
const collection = new Collection(
  0,
  "Foo",
  5,
  this.accounts[0].address,
  "FOO",
  Collection.generateId(u8aToHex(this.accounts[0].publicKey), "FOO"),
  "https://some.url"
);
```

### `NFT`

```js
import { fetchRemarks } from 'rmrk-tools';
```

... TODO

### `fetchRemarks`

```js
import { fetchRemarks } from 'rmrk-tools';

const wsProvider = new WsProvider('wss://node.rmrk.app');
const api = await ApiPromise.create({ provider: wsProvider });
await api.isReady;
const remarkBlocks = await fetchRemarks(api, 6431422, 6431424, ['']);
```

### `getLatestFinalizedBlock`

Get latest block number on the provided chain using polkadot api

```js
import { getLatestFinalizedBlock } from 'rmrk-tools';

const wsProvider = new WsProvider('wss://node.rmrk.app');
const api = await ApiPromise.create({ provider: wsProvider });
const to = await utils.getLatestFinalizedBlock(api);
```

### `getRemarksFromBlocks`

Turn extrinsics into remark objects

```js
import { getRemarksFromBlocks } from 'rmrk-tools';
const remarks = getRemarksFromBlocks(remarkBlocks);
```

## Helper Tools

### Fetch

Grabs all `system.remark` extrinsics in a block range and logs an array of them all, keyed by block.

Export functionality will be added soon (SQL and file, total and in chunks).

```bash
yarn cli:fetch
```

Optional parameters:

- `--ws URL`: websocket URL to connecto to, defaults to `127.0.0.1:9944`
- `--from FROM`: block from which to start, defaults to 0 (note that for RMRK, canonically the block 4892957 is genesis)
- `--to TO`: block until which to search, defaults to latest
- `--prefixes PREFIXES`: limit return data to only remarks with these prefixes. Can be comma separated list. Prefixes can be hex or utf8. Case sensitive. Example: 0x726d726b,0x524d524b
- `--append PATH`: special mode which takes the last block in an existing dump file + 1 as FROM (overrides FROM). Appends new blocks with remarks into that file. Convenient for running via cronjob for continuous remark list building. Performance right now is 1000 blocks per 10 seconds, so processing 5000 blocks with a `* * * * *` cronjob should be doable. Example: `yarn cli:fetch --prefixes=0x726d726b,0x524d524b --append=somefile.json`
- `--collection`: filter by specific collection or part of collection ID (i.e. RMRK substring)
- `--fin`: defaults to "yes" if omitted. When "yes", fetches up to last finalized block if `to` is omitted. Otherwise, last block. `no` is useful for testing.
- `--output`: name of the file into which to save the output. Overridden if `append` is used.

The return data will look like this:

```json
[
  {
    block: 8,
    call: [
      {
        call: "system.remark",
        value: "0x13371337",
      },
      {
        call: "balances.transfer",
        value:
          "5CK8D1sKNwF473wbuBP6NuhQfPaWUetNsWUNAAzVwTfxqjfr,10000000000000000",
      },
    ],
  },
  {
    block: 20,
    call: [
      {
        call: "system.remark",
        value: "0x13371338",
      },
    ],
  },
];
```

## Consolidate

Takes as input a JSON file and processes all remarks within it to reach a final state of the NFT ecosystem based on that JSON.

```bash
 yarn cli:consolidate --json=dumps/remarks-4892957-5437981-0x726d726b.json
```

Todo:

- [ ] Write adapter interface
- [ ] Support multiple adapters apart from JSON (SQL?)
- [ ] Write exporters for SQL (ready-to-execute, or even direct to DB)
- [ ] Write class for a single RMRK entry so it's easy to iterate through across these different adapters and consolidators

## Seed

> Note, none of the below is true, this is still VERY much a work in progress.

A local chain must be running in `--dev` mode for this to work.

```bash
yarn cli:seed --folder=[folder]
```

When running a local chain, you can run `yarn seed` to populate the chain with pre-written NFT configurations. This is good for testing UIs, wallets, etc. It will use the unlocked ALICE, BOB, and CHARLIE accounts so `--dev` is required here.

You can see how the seeders are written in `test/seed/default`. `yarn seed` will by default execute all the seeds in the `default` folder. If you want to execute only your own seeders, put them into a subfolder inside `test/seed` and provide the folder name: `yarn seed myfolder`.

Check that all edge cases are covered by running [Consolidate](#consolidate).

## Generate Metadata

This script generates an array of objects with metadata IPFS URIs ready to be added to NFTs.

First, create a seed JSON file with an array of metadata fields and file path (see `metadata-seed.example.json` for example) for each image. This script will first upload the image to IPFS and pin it using [Pinata](https://pinata.cloud) and then upload the metadata JSON object to IPFS and pin it, returning an array of IPFS urls ready to be added to NFTs and/or collections.

```bash
PINATA_KEY=XXX PINATA_SECRET=XXX yarn cli:metadata --input=metadata-seed.example.json --output=metadata-seed-output.json
```

> Note that it is recommended to pin the resulting hashes into multiple additional pinning services or (better) your own IPFS node to increase dissemination of the content.
