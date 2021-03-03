let api = require("@polkadot/api");
let util = require("@polkadot/util");
let util_crypto = require("@polkadot/util-crypto");
let keyring = require("@polkadot/keyring");
let types = require("@polkadot/types");
let dappex = require("@polkadot/extension-dapp");
let consolidator = require("./build/src/tools/consolidator/consolidator.js");
let c100 = require("./build/src/rmrk1.0.0/classes/collection.js");
let n100 = require("./build/src/rmrk1.0.0/classes/nft.js");

let rmrk = {
  consolidator: consolidator,
};
window.rmrk = rmrk;
window.api = api;
window.util = util;
window.util_crypto = util_crypto;
window.keyring = keyring;
window.types = types;
window.dappex = dappex;

window.c100 = c100;
window.n100 = n100;
