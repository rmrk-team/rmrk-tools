import * as util_crypto from "@polkadot/util-crypto";
import * as dappex from "@polkadot/extension-dapp";
import { Consolidator as consolidator } from "./tools/consolidator/consolidator.js";
import { Collection as c100 } from "./rmrk1.0.0/classes/collection.js";

import { NFT as n100 } from "./rmrk1.0.0/classes/nft.js";

const rmrk = {
  consolidator: consolidator,
};

const polkadot = {
  util_crypto,
  dappex,
};

export { polkadot, rmrk, c100, n100 };
