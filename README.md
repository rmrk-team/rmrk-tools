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
- `--from FROM`: block from which to start, defaults to 0
- `--to TO`: block until which to search, defaults to latest
- `--prefix PREFIX`: limit return data to only remarks with this prefix
