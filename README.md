# RMRK Tools

Typescript implementation of the [RMRK spec](https://github.com/Swader/rmrk-spec/).

## Usage

TBD

## Read VS Write

Some applications (wallets, portfolios, galleries) might need only _read_ functionality, while others will need both _read_ and _write_ (auction houses). Reading happens through the State object which can be populated in different ways. Writing happens though the Polkadot JS API object. Each has to be configured and injected separately, but once injected into the RMRK class' instance, the injections will be inherited by the underlying logic.

You can inject the State and API instances into Collection and NFT objects as well, but note that this is very inefficient as the RMRK class does this for you when building these objects, and also automatically calls the state's `refresh` function before every write.

### State

Because RMRK relies on an append-only log of system remarks (blockchain graffiti), it is **absolutely imperative** that the current and latest state of all RMRK NFTs in the system is up to date and available to the library before performing any write operations like SEND or BUY.

This is made possible with the State object which defines an interface for fetching the current and past states. Three types of State are supported out of the box:

- SQLState
- LiveState
- StaticState

## Helper Tools

### Fetch

Grabs all `system.remark` extrinsics in a block range and logs an array of them all, keyed by block.

Export functionality will be added soon (SQL and file, total and in chunks).

```bash
yarn fetch
```

Optional parameters:

- `--ws URL`: websocket URL to connecto to, defaults to `127.0.0.1:9944`
- `--from FROM`: block from which to start, defaults to 0 (note that for RMRK, canonically the block 4892957 is genesis)
- `--to TO`: block until which to search, defaults to latest
- `--prefix PREFIX`: limit return data to only remarks with this prefix

The return data will look like this:

```js
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
 yarn consolidate --json=dumps/remarks-4892957-5437981-0x726d726b.json
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
yarn seed --folder=[folder]
```

When running a local chain, you can run `yarn seed` to populate the chain with pre-written NFT configurations. This is good for testing UIs, wallets, etc. It will use the unlocked ALICE, BOB, and CHARLIE accounts so `--dev` is required here.

You can see how the seeders are written in `test/seed/default`. `yarn seed` will by default execute all the seeds in the `default` folder. If you want to execute only your own seeders, put them into a subfolder inside `test/seed` and provide the folder name: `yarn seed myfolder`.

Check that all edge cases are covered by running [Consolidate](#consolidate).
