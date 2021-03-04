'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('url');
var buffer = require('buffer');
var xTextencoder = require('@polkadot/x-textencoder');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var buffer__default = /*#__PURE__*/_interopDefaultLegacy(buffer);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

class Collection {
    constructor(block, name, max, issuer, symbol, id, metadata) {
        this.changes = [];
        this.block = block;
        this.name = name;
        this.max = max;
        this.issuer = issuer;
        this.symbol = symbol;
        this.id = id;
        this.metadata = metadata;
    }
    mint() {
        if (this.block) {
            throw new Error("An already existing collection cannot be minted!");
        }
        return `RMRK::MINT::${Collection.V}::${encodeURIComponent(JSON.stringify({
            name: this.name,
            max: this.max,
            issuer: this.issuer,
            symbol: this.symbol.toUpperCase(),
            id: this.id,
            metadata: this.metadata,
        }))}`;
    }
    change_issuer(address) {
        if (this.block === 0) {
            throw new Error("This collection is new, so there's no issuer to change." +
                " If it has been deployed on chain, load the existing " +
                "collection as a new instance first, then change issuer.");
        }
        return `RMRK::CHANGEISSUER::${Collection.V}::${this.id}::${address}`;
    }
    addChange(c) {
        this.changes.push(c);
        return this;
    }
    getChanges() {
        return this.changes;
    }
    static generateId(pubkey, symbol) {
        if (!pubkey.startsWith("0x")) {
            throw new Error("This is not a valid pubkey, it does not start with 0x");
        }
        //console.log(pubkey);
        return (pubkey.substr(2, 10) +
            pubkey.substring(pubkey.length - 8) +
            "-" +
            symbol.toUpperCase());
    }
    static fromRemark(remark, block) {
        if (!block) {
            block = 0;
        }
        const exploded = remark.split("::");
        try {
            if (exploded[0].toUpperCase() != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[1] != "MINT")
                throw new Error("The op code needs to be MINT, is " + exploded[1]);
            if (exploded[2] != Collection.V) {
                throw new Error(`This remark was issued under version ${exploded[2]} instead of ${Collection.V}`);
            }
            const data = decodeURIComponent(exploded[3]);
            const obj = JSON.parse(data);
            if (!obj)
                throw new Error(`Could not parse object from: ${data}`);
            if (undefined === obj.metadata ||
                (!obj.metadata.startsWith("ipfs") && !obj.metadata.startsWith("http")))
                throw new Error(`Invalid metadata - not an HTTP or IPFS URL`);
            if (undefined === obj.name)
                throw new Error(`Missing field: name`);
            if (undefined === obj.max)
                throw new Error(`Missing field: max`);
            if (undefined === obj.issuer)
                throw new Error(`Missing field: issuer`);
            if (undefined === obj.symbol)
                throw new Error(`Missing field: symbol`);
            if (undefined === obj.id)
                throw new Error(`Missing field: id`);
            return new this(block, obj.name, obj.max, obj.issuer, obj.symbol, obj.id, obj.metadata);
        }
        catch (e) {
            console.error(e.message);
            console.log(`MINT error: full input was ${remark}`);
            return e.message;
        }
    }
    /**
     * TBD - hard dependency on Axios / IPFS to fetch remote
     */
    load_metadata() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.loadedMetadata)
                return this.loadedMetadata;
            return {};
        });
    }
}
Collection.V = "RMRK1.0.0";
var DisplayType$1;
(function (DisplayType) {
    DisplayType[DisplayType["null"] = 0] = "null";
    DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
    DisplayType[DisplayType["number"] = 2] = "number";
    DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
})(DisplayType$1 || (DisplayType$1 = {}));

class NFT {
    constructor(block, collection, name, instance, transferable, sn, metadata, data) {
        this.changes = [];
        this.block = block;
        this.collection = collection;
        this.name = name;
        this.instance = instance;
        this.transferable = transferable;
        this.sn = sn;
        this.data = data;
        this.metadata = metadata;
        this.owner = "";
        this.reactions = {};
    }
    getId() {
        if (!this.block)
            throw new Error("This token is not minted, so it cannot have an ID.");
        return `${this.block}-${this.collection}-${this.instance}-${this.sn}`;
    }
    addChange(c) {
        this.changes.push(c);
        return this;
    }
    mintnft() {
        if (this.block) {
            throw new Error("An already existing NFT cannot be minted!");
        }
        return `RMRK::MINTNFT::${NFT.V}::${encodeURIComponent(JSON.stringify({
            collection: this.collection,
            name: this.name,
            instance: this.instance,
            transferable: this.transferable,
            sn: this.sn,
            metadata: this.metadata,
        }))}`;
    }
    send(recipient) {
        if (!this.block) {
            throw new Error(`You can only send an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::SEND::${NFT.V}::${this.getId()}::${recipient}`;
    }
    // @todo build this out, maybe data type?
    static checkDataFormat(data) {
        return true;
    }
    static fromRemark(remark, block) {
        if (!block) {
            block = 0;
        }
        const exploded = remark.split("::");
        try {
            if (exploded[0].toUpperCase() != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[1] != "MINTNFT")
                throw new Error("The op code needs to be MINTNFT, is " + exploded[1]);
            if (exploded[2] != NFT.V) {
                throw new Error(`This remark was issued under version ${exploded[2]} instead of ${NFT.V}`);
            }
            const data = decodeURIComponent(exploded[3]);
            const obj = JSON.parse(data);
            if (!obj)
                throw new Error(`Could not parse object from: ${data}`);
            // Check if the object has either data or metadata
            if ((undefined === obj.metadata ||
                (!obj.metadata.startsWith("ipfs") &&
                    !obj.metadata.startsWith("http"))) &&
                undefined === obj.data)
                throw new Error(`Invalid metadata (not an HTTP or IPFS URL) and missing data`);
            if (obj.data) {
                NFT.checkDataFormat(obj.data);
            }
            if (undefined === obj.name)
                throw new Error(`Missing field: name`);
            if (undefined === obj.collection)
                throw new Error(`Missing field: collection`);
            if (undefined === obj.instance)
                throw new Error(`Missing field: instance`);
            if (undefined === obj.transferable)
                throw new Error(`Missing field: transferable`);
            if (undefined === obj.sn)
                throw new Error(`Missing field: sn`);
            return new this(block, obj.collection, obj.name, obj.instance, obj.transferable, obj.sn, obj.metadata, obj.data);
        }
        catch (e) {
            console.error(e.message);
            console.log(`MINTNFT error: full input was ${remark}`);
            return e.message;
        }
    }
    /**
     * @param price In plancks, so 10000000000 for 0.01 KSM. Set to 0 if canceling listing.
     */
    list(price) {
        if (!this.block) {
            throw new Error(`You can only list an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::LIST::${NFT.V}::${this.getId()}::${price > 0 ? price : "cancel"}`;
    }
    buy() {
        if (!this.block) {
            throw new Error(`You can only buy an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::BUY::${NFT.V}::${this.getId()}`;
    }
    consume() {
        if (!this.block) {
            throw new Error(`You can only consume an existing NFT. If you just minted this, please load a new, 
        separate instance as the block number is an important part of an NFT's ID.`);
        }
        return `RMRK::CONSUME::${NFT.V}::${this.getId()}`;
    }
    /**
     * TBD - hard dependency on Axios / IPFS to fetch remote
     */
    load_metadata() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.loadedMetadata)
                return this.loadedMetadata;
            return {};
        });
    }
}
NFT.V = "RMRK1.0.0";
var DisplayType;
(function (DisplayType) {
    DisplayType[DisplayType["null"] = 0] = "null";
    DisplayType[DisplayType["boost_number"] = 1] = "boost_number";
    DisplayType[DisplayType["number"] = 2] = "number";
    DisplayType[DisplayType["boost_percentage"] = 3] = "boost_percentage";
})(DisplayType || (DisplayType = {}));

class ChangeIssuer {
    constructor(issuer, id) {
        this.issuer = issuer;
        this.id = id;
    }
    static fromRemark(remark) {
        const exploded = remark.split("::");
        try {
            if (exploded[0] != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[2] != ChangeIssuer.V)
                throw new Error(`Version mismatch. Is ${exploded[2]}, should be ${ChangeIssuer.V}`);
            if (exploded[1] != "CHANGEISSUER")
                throw new Error("The op code needs to be CHANGEISSUER, is " + exploded[1]);
            if (undefined === exploded[3] || undefined == exploded[4]) {
                throw new Error("Cound not find ID or new issuer");
            }
        }
        catch (e) {
            console.error(e.message);
            console.log(`CHANGEISSUER error: full input was ${remark}`);
            return e.message;
        }
        const ci = new ChangeIssuer(exploded[4], exploded[3]);
        return ci;
    }
}
ChangeIssuer.V = "RMRK1.0.0";

class Send {
    constructor(id, recipient) {
        this.recipient = recipient;
        this.id = id;
    }
    static fromRemark(remark) {
        const exploded = remark.split("::");
        try {
            if (exploded[0] != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[2] != Send.V)
                throw new Error(`Version mismatch. Is ${exploded[2]}, should be ${Send.V}`);
            if (exploded[1] != "SEND")
                throw new Error("The op code needs to be SEND, is " + exploded[1]);
            if (undefined === exploded[3] || undefined == exploded[4]) {
                throw new Error("Cound not find ID or recipient");
            }
        }
        catch (e) {
            console.error(e.message);
            console.log(`SEND error: full input was ${remark}`);
            return e.message;
        }
        return new Send(exploded[3], exploded[4]);
    }
}
Send.V = "RMRK1.0.0";

class Emote {
    constructor(id, unicode) {
        this.unicode = unicode;
        this.id = id;
    }
    static fromRemark(remark) {
        const exploded = remark.split("::");
        try {
            if (exploded[0] != "RMRK")
                throw new Error("Invalid remark - does not start with RMRK");
            if (exploded[2] != Emote.V)
                throw new Error(`Version mismatch. Is ${exploded[2]}, should be ${Emote.V}`);
            if (exploded[1] != "EMOTE")
                throw new Error("The op code needs to be EMOTE, is " + exploded[1]);
            if (undefined === exploded[3] || undefined == exploded[4]) {
                throw new Error("Cound not find ID or unicode");
            }
        }
        catch (e) {
            console.error(e.message);
            console.log(`EMOTE error: full input was ${remark}`);
            return e.message;
        }
        return new Emote(exploded[3], exploded[4]);
    }
}
Emote.V = "RMRK1.0.0";

// Copyright 2017-2021 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line @typescript-eslint/ban-types

/**
 * @name isFunction
 * @summary Tests for a `function`.
 * @description
 * Checks to see if the input value is a JavaScript function.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isFunction } from '@polkadot/util';
 *
 * isFunction(() => false); // => true
 * ```
 */
function isFunction(value) {
  return typeof value === 'function';
}

// Copyright 2017-2021 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name isString
 * @summary Tests for a string.
 * @description
 * Checks to see if the input value is a JavaScript string.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isString } from '@polkadot/util';
 *
 * console.log('isString', isString('test')); // => true
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

// Copyright 2017-2021 @polkadot/util authors & contributors
/**
 * @name assert
 * @summary Checks for a valid test, if not Error is thrown.
 * @description
 * Checks that `test` is a truthy value. If value is falsy (`null`, `undefined`, `false`, ...), it throws an Error with the supplied `message`. When `test` passes, `true` is returned.
 * @example
 * <BR>
 *
 * ```javascript
 * const { assert } from '@polkadot/util';
 *
 * assert(true, 'True should be true'); // passes
 * assert(false, 'False should not be true'); // Error thrown
 * assert(false, () => 'message'); // Error with 'message'
 * ```
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(isFunction(message) ? message() : message);
  }
}

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

// Copyright 2017-2021 @polkadot/util authors & contributors
const HEX_REGEX = /^0x[a-fA-F0-9]+$/;
/**
 * @name isHex
 * @summary Tests for a hex string.
 * @description
 * Checks to see if the input value is a `0x` prefixed hex string. Optionally (`bitLength` !== -1) checks to see if the bitLength is correct.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isHex } from '@polkadot/util';
 *
 * isHex('0x1234'); // => true
 * isHex('0x1234', 8); // => false
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types

function isHex(value, bitLength = -1, ignoreLength = false) {
  const isValidHex = value === '0x' || isString(value) && HEX_REGEX.test(value.toString());

  if (isValidHex && bitLength !== -1) {
    return value.length === 2 + Math.ceil(bitLength / 4);
  }

  return isValidHex && (ignoreLength || value.length % 2 === 0);
}

// Copyright 2017-2021 @polkadot/util authors & contributors
/**
 * @name hexHasPrefix
 * @summary Tests for the existence of a `0x` prefix.
 * @description
 * Checks for a valid hex input value and if the start matched `0x`
 * @example
 * <BR>
 *
 * ```javascript
 * import { hexHasPrefix } from '@polkadot/util';
 *
 * console.log('has prefix', hexHasPrefix('0x1234')); // => true
 * ```
 */

function hexHasPrefix(value) {
  return !!(value && isHex(value, -1, true) && value.substr(0, 2) === '0x');
}

// Copyright 2017-2021 @polkadot/util authors & contributors
const UNPREFIX_HEX_REGEX = /^[a-fA-F0-9]+$/;
/**
 * @name hexStripPrefix
 * @summary Strips any leading `0x` prefix.
 * @description
 * Tests for the existence of a `0x` prefix, and returns the value without the prefix. Un-prefixed values are returned as-is.
 * @example
 * <BR>
 *
 * ```javascript
 * import { hexStripPrefix } from '@polkadot/util';
 *
 * console.log('stripped', hexStripPrefix('0x1234')); // => 1234
 * ```
 */

function hexStripPrefix(value) {
  if (!value) {
    return '';
  }

  if (hexHasPrefix(value)) {
    return value.substr(2);
  }

  if (UNPREFIX_HEX_REGEX.test(value)) {
    return value;
  }

  throw new Error(`Invalid hex ${value} passed to hexStripPrefix`);
}

// Copyright 2017-2021 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name bufferToU8a
 * @summary Creates a Uint8Array value from a Buffer object.
 * @description
 * `null` inputs returns an empty result, `Buffer` values return the actual value as a `Uint8Array`. Anything that is not a `Buffer` object throws an error.
 * @example
 * <BR>
 *
 * ```javascript
 * import { bufferToU8a } from '@polkadot/util';
 *
 * bufferToU8a(Buffer.from([1, 2, 3]));
 * ```
 */
function bufferToU8a(buffer) {
  return new Uint8Array(buffer || []);
}

// Copyright 2017-2021 @polkadot/util authors & contributors
/**
 * @name hexToU8a
 * @summary Creates a Uint8Array object from a hex string.
 * @description
 * `null` inputs returns an empty `Uint8Array` result. Hex input values return the actual bytes value converted to a Uint8Array. Anything that is not a hex string (including the `0x` prefix) throws an error.
 * @example
 * <BR>
 *
 * ```javascript
 * import { hexToU8a } from '@polkadot/util';
 *
 * hexToU8a('0x80001f'); // Uint8Array([0x80, 0x00, 0x1f])
 * hexToU8a('0x80001f', 32); // Uint8Array([0x00, 0x80, 0x00, 0x1f])
 * ```
 */

function hexToU8a(_value, bitLength = -1) {
  if (!_value) {
    return new Uint8Array();
  }

  assert(isHex(_value), `Expected hex value to convert, found '${_value}'`);
  const value = hexStripPrefix(_value);
  const valLength = value.length / 2;
  const bufLength = Math.ceil(bitLength === -1 ? valLength : bitLength / 8);
  const result = new Uint8Array(bufLength);
  const offset = Math.max(0, bufLength - valLength);

  for (let index = 0; index < bufLength; index++) {
    result[index + offset] = parseInt(value.substr(index * 2, 2), 16);
  }

  return result;
}

// Copyright 2017-2021 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name isBuffer
 * @summary Tests for a `Buffer` object instance.
 * @description
 * Checks to see if the input object is an instance of `Buffer`.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isBuffer } from '@polkadot/util';
 *
 * console.log('isBuffer', isBuffer(Buffer.from([]))); // => true
 * ```
 */
function isBuffer(value) {
  return Buffer.isBuffer(value);
}

// Copyright 2017-2021 @polkadot/util authors & contributors
const encoder = new xTextencoder.TextEncoder();
/**
 * @name stringToU8a
 * @summary Creates a Uint8Array object from a utf-8 string.
 * @description
 * String input values return the actual encoded `UInt8Array`. `null` or `undefined` values returns an empty encoded array.
 * @example
 * <BR>
 *
 * ```javascript
 * import { stringToU8a } from '@polkadot/util';
 *
 * stringToU8a('hello'); // [0x68, 0x65, 0x6c, 0x6c, 0x6f]
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types

function stringToU8a(value) {
  return value ? encoder.encode(value.toString()) : new Uint8Array();
}

// Copyright 2017-2021 @polkadot/util authors & contributors

function convertArray(value) {
  return Array.isArray(value) ? Uint8Array.from(value) : value;
}

function convertString(value) {
  return isHex(value) ? hexToU8a(value) : stringToU8a(value);
}
/**
 * @name u8aToU8a
 * @summary Creates a Uint8Array value from a Uint8Array, Buffer, string or hex input.
 * @description
 * `null` or `undefined` inputs returns a `[]` result, Uint8Array values returns the value, hex strings returns a Uint8Array representation.
 * @example
 * <BR>
 *
 * ```javascript
 * import { { u8aToU8a } from '@polkadot/util';
 *
 * u8aToU8a(new Uint8Array([0x12, 0x34]); // => Uint8Array([0x12, 0x34])
 * u8aToU8a(0x1234); // => Uint8Array([0x12, 0x34])
 * ```
 */


function u8aToU8a(value) {
  if (!value) {
    return new Uint8Array();
  } else if (isBuffer(value)) {
    return bufferToU8a(value);
  } else if (isString(value)) {
    return convertString(value);
  }

  return convertArray(value);
}

// Copyright 2017-2021 @polkadot/util authors & contributors
/**
 * @name u8aConcat
 * @summary Creates a concatenated Uint8Array from the inputs.
 * @description
 * Concatenates the input arrays into a single `UInt8Array`.
 * @example
 * <BR>
 *
 * ```javascript
 * import { { u8aConcat } from '@polkadot/util';
 *
 * u8aConcat(
 *   new Uint8Array([1, 2, 3]),
 *   new Uint8Array([4, 5, 6])
 * ); // [1, 2, 3, 4, 5, 6]
 * ```
 */

function u8aConcat(...list) {
  let length = 0;
  let offset = 0;
  const u8as = new Array(list.length);

  for (let i = 0; i < list.length; i++) {
    u8as[i] = u8aToU8a(list[i]);
    length += u8as[i].length;
  }

  const result = new Uint8Array(length);

  for (let i = 0; i < u8as.length; i++) {
    result.set(u8as[i], offset);
    offset += u8as[i].length;
  }

  return result;
}

// Copyright 2017-2021 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0
const ALPHABET = new Array(256).fill(0).map((_, n) => n.toString(16).padStart(2, '0'));
/** @internal */

function extract(value) {
  const result = new Array(value.length);

  for (let i = 0; i < value.length; i++) {
    result[i] = ALPHABET[value[i]];
  }

  return result.join('');
}
/** @internal */


function trim(value, halfLength) {
  return `${u8aToHex(value.subarray(0, halfLength), -1, false)}…${u8aToHex(value.subarray(value.length - halfLength), -1, false)}`;
}
/**
 * @name u8aToHex
 * @summary Creates a hex string from a Uint8Array object.
 * @description
 * `UInt8Array` input values return the actual hex string. `null` or `undefined` values returns an `0x` string.
 * @example
 * <BR>
 *
 * ```javascript
 * import { u8aToHex } from '@polkadot/util';
 *
 * u8aToHex(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0xf])); // 0x68656c0f
 * ```
 */


function u8aToHex(value, bitLength = -1, isPrefixed = true) {
  const prefix = isPrefixed ? '0x' : '';

  if (!(value !== null && value !== void 0 && value.length)) {
    return prefix;
  }

  const byteLength = Math.ceil(bitLength / 8);
  return prefix + (byteLength > 0 && value.length > byteLength ? trim(value, Math.ceil(byteLength / 2)) : extract(value));
}

// Copyright 2017-2021 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name isInstanceOf
 * @summary Tests for a instance of a class.
 * @description
 * Checks to see if the input value is an instance of the test class.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isInstanceOf } from '@polkadot/util';
 *
 * console.log('isInstanceOf', isInstanceOf(new Array(0), Array)); // => true
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function isInstanceOf(value, clazz) {
  return value instanceof clazz;
}

// Copyright 2017-2021 @polkadot/util authors & contributors
/**
 * @name isU8a
 * @summary Tests for a `Uint8Array` object instance.
 * @description
 * Checks to see if the input object is an instance of `Uint8Array`.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isUint8Array } from '@polkadot/util';
 *
 * console.log('isU8a', isU8a([])); // => false
 * ```
 */

function isU8a(value) {
  return isInstanceOf(value, Uint8Array);
}

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

var safeBuffer = createCommonjsModule(function (module, exports) {
/* eslint-disable node/no-deprecated-api */


var Buffer = buffer__default['default'].Buffer; // alternative to using Object.keys for old browsers

function copyProps(src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}

if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer__default['default'];
} else {
  // Copy properties from require('buffer')
  copyProps(buffer__default['default'], exports);
  exports.Buffer = SafeBuffer;
}

function SafeBuffer(arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length);
}

SafeBuffer.prototype = Object.create(Buffer.prototype); // Copy static methods from Buffer

copyProps(Buffer, SafeBuffer);

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number');
  }

  return Buffer(arg, encodingOrOffset, length);
};

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number');
  }

  var buf = Buffer(size);

  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding);
    } else {
      buf.fill(fill);
    }
  } else {
    buf.fill(0);
  }

  return buf;
};

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number');
  }

  return Buffer(size);
};

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number');
  }

  return buffer__default['default'].SlowBuffer(size);
};
});

// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
// @ts-ignore

var _Buffer = safeBuffer.Buffer;

function base(ALPHABET) {
  if (ALPHABET.length >= 255) {
    throw new TypeError('Alphabet too long');
  }

  var BASE_MAP = new Uint8Array(256);

  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }

  for (var i = 0; i < ALPHABET.length; i++) {
    var x = ALPHABET.charAt(i);
    var xc = x.charCodeAt(0);

    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(x + ' is ambiguous');
    }

    BASE_MAP[xc] = i;
  }

  var BASE = ALPHABET.length;
  var LEADER = ALPHABET.charAt(0);
  var FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up

  var iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up

  function encode(source) {
    if (Array.isArray(source) || source instanceof Uint8Array) {
      source = _Buffer.from(source);
    }

    if (!_Buffer.isBuffer(source)) {
      throw new TypeError('Expected Buffer');
    }

    if (source.length === 0) {
      return '';
    } // Skip & count leading zeroes.


    var zeroes = 0;
    var length = 0;
    var pbegin = 0;
    var pend = source.length;

    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    } // Allocate enough space in big-endian base58 representation.


    var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
    var b58 = new Uint8Array(size); // Process the bytes.

    while (pbegin !== pend) {
      var carry = source[pbegin]; // Apply "b58 = b58 * 256 + ch".

      var i = 0;

      for (var it1 = size - 1; (carry !== 0 || i < length) && it1 !== -1; it1--, i++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }

      if (carry !== 0) {
        throw new Error('Non-zero carry');
      }

      length = i;
      pbegin++;
    } // Skip leading zeroes in base58 result.


    var it2 = size - length;

    while (it2 !== size && b58[it2] === 0) {
      it2++;
    } // Translate the result into a string.


    var str = LEADER.repeat(zeroes);

    for (; it2 < size; ++it2) {
      str += ALPHABET.charAt(b58[it2]);
    }

    return str;
  }

  function decodeUnsafe(source) {
    if (typeof source !== 'string') {
      throw new TypeError('Expected String');
    }

    if (source.length === 0) {
      return _Buffer.alloc(0);
    }

    var psz = 0; // Skip leading spaces.

    if (source[psz] === ' ') {
      return;
    } // Skip and count leading '1's.


    var zeroes = 0;
    var length = 0;

    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    } // Allocate enough space in big-endian base256 representation.


    var size = (source.length - psz) * FACTOR + 1 >>> 0; // log(58) / log(256), rounded up.

    var b256 = new Uint8Array(size); // Process the characters.

    while (source[psz]) {
      // Decode character
      var carry = BASE_MAP[source.charCodeAt(psz)]; // Invalid character

      if (carry === 255) {
        return;
      }

      var i = 0;

      for (var it3 = size - 1; (carry !== 0 || i < length) && it3 !== -1; it3--, i++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }

      if (carry !== 0) {
        throw new Error('Non-zero carry');
      }

      length = i;
      psz++;
    } // Skip trailing spaces.


    if (source[psz] === ' ') {
      return;
    } // Skip leading zeroes in b256.


    var it4 = size - length;

    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }

    var vch = _Buffer.allocUnsafe(zeroes + (size - it4));

    vch.fill(0x00, 0, zeroes);
    var j = zeroes;

    while (it4 !== size) {
      vch[j++] = b256[it4++];
    }

    return vch;
  }

  function decode(string) {
    var buffer = decodeUnsafe(string);

    if (buffer) {
      return buffer;
    }

    throw new Error('Non-base' + BASE + ' character');
  }

  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  };
}

var src = base;

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = src(BASE58_ALPHABET);

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
const BASE_CONFIG = {
  alphabet: BASE58_ALPHABET,
  ipfsChar: 'z',
  type: 'base58'
};
function validateChars({
  alphabet,
  ipfsChar,
  type
}, value, ipfsCompat) {
  assert(value, `Expected non-null, non-empty ${type} input`);
  assert(!ipfsCompat || value[0] === ipfsChar, `Expected ${type} to start with '${ipfsChar}'`);

  for (let i = ipfsCompat ? 1 : 0; i < value.length; i++) {
    assert(alphabet.includes(value[i]), `Invalid ${type} character "${value[i]}" (0x${value.charCodeAt(i).toString(16)}) at index ${i}`);
  }

  return true;
}
/**
 * @name base58Validate
 * @summary Validates a base58 value.
 * @description
 * Validates the the supplied value is valid base58
 */

function base58Validate(value, ipfsCompat) {
  return validateChars(BASE_CONFIG, value, ipfsCompat);
}

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
/**
 * @name base58Decode
 * @summary Decodes a base58 value.
 * @description
 * From the provided input, decode the base58 and return the result as an `Uint8Array`.
 */

function base58Decode(value, ipfsCompat) {
  base58Validate(value, ipfsCompat);
  return bufferToU8a(bs58.decode(value.substr(ipfsCompat ? 1 : 0)));
}

var ERROR_MSG_INPUT = 'Input must be an string, Buffer or Uint8Array'; // For convenience, let people hash a string, not just a Uint8Array

function normalizeInput(input) {
  var ret;

  if (input instanceof Uint8Array) {
    ret = input;
  } else if (input instanceof Buffer) {
    ret = new Uint8Array(input);
  } else if (typeof input === 'string') {
    ret = new Uint8Array(Buffer.from(input, 'utf8'));
  } else {
    throw new Error(ERROR_MSG_INPUT);
  }

  return ret;
} // Converts a Uint8Array to a hexadecimal string
// For example, toHex([255, 0, 255]) returns "ff00ff"


function toHex(bytes) {
  return Array.prototype.map.call(bytes, function (n) {
    return (n < 16 ? '0' : '') + n.toString(16);
  }).join('');
} // Converts any value in [0...2^32-1] to an 8-character hex string


function uint32ToHex(val) {
  return (0x100000000 + val).toString(16).substring(1);
} // For debugging: prints out hash state in the same format as the RFC
// sample computation exactly, so that you can diff


function debugPrint(label, arr, size) {
  var msg = '\n' + label + ' = ';

  for (var i = 0; i < arr.length; i += 2) {
    if (size === 32) {
      msg += uint32ToHex(arr[i]).toUpperCase();
      msg += ' ';
      msg += uint32ToHex(arr[i + 1]).toUpperCase();
    } else if (size === 64) {
      msg += uint32ToHex(arr[i + 1]).toUpperCase();
      msg += uint32ToHex(arr[i]).toUpperCase();
    } else throw new Error('Invalid size ' + size);

    if (i % 6 === 4) {
      msg += '\n' + new Array(label.length + 4).join(' ');
    } else if (i < arr.length - 2) {
      msg += ' ';
    }
  }

  console.log(msg);
} // For performance testing: generates N bytes of input, hashes M times
// Measures and prints MB/second hash performance each time


function testSpeed(hashFn, N, M) {
  var startMs = new Date().getTime();
  var input = new Uint8Array(N);

  for (var i = 0; i < N; i++) {
    input[i] = i % 256;
  }

  var genMs = new Date().getTime();
  console.log('Generated random input in ' + (genMs - startMs) + 'ms');
  startMs = genMs;

  for (i = 0; i < M; i++) {
    var hashHex = hashFn(input);
    var hashMs = new Date().getTime();
    var ms = hashMs - startMs;
    startMs = hashMs;
    console.log('Hashed in ' + ms + 'ms: ' + hashHex.substring(0, 20) + '...');
    console.log(Math.round(N / (1 << 20) / (ms / 1000) * 100) / 100 + ' MB PER SECOND');
  }
}

var util = {
  normalizeInput: normalizeInput,
  toHex: toHex,
  debugPrint: debugPrint,
  testSpeed: testSpeed
};

// Blake2B in pure Javascript
// Adapted from the reference implementation in RFC7693
// Ported to Javascript by DC - https://github.com/dcposch
 // 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array


function ADD64AA(v, a, b) {
  var o0 = v[a] + v[b];
  var o1 = v[a + 1] + v[b + 1];

  if (o0 >= 0x100000000) {
    o1++;
  }

  v[a] = o0;
  v[a + 1] = o1;
} // 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits


function ADD64AC(v, a, b0, b1) {
  var o0 = v[a] + b0;

  if (b0 < 0) {
    o0 += 0x100000000;
  }

  var o1 = v[a + 1] + b1;

  if (o0 >= 0x100000000) {
    o1++;
  }

  v[a] = o0;
  v[a + 1] = o1;
} // Little-endian byte access


function B2B_GET32(arr, i) {
  return arr[i] ^ arr[i + 1] << 8 ^ arr[i + 2] << 16 ^ arr[i + 3] << 24;
} // G Mixing function
// The ROTRs are inlined for speed


function B2B_G(a, b, c, d, ix, iy) {
  var x0 = m$1[ix];
  var x1 = m$1[ix + 1];
  var y0 = m$1[iy];
  var y1 = m$1[iy + 1];
  ADD64AA(v$1, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s

  ADD64AC(v$1, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits
  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits

  var xor0 = v$1[d] ^ v$1[a];
  var xor1 = v$1[d + 1] ^ v$1[a + 1];
  v$1[d] = xor1;
  v$1[d + 1] = xor0;
  ADD64AA(v$1, c, d); // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits

  xor0 = v$1[b] ^ v$1[c];
  xor1 = v$1[b + 1] ^ v$1[c + 1];
  v$1[b] = xor0 >>> 24 ^ xor1 << 8;
  v$1[b + 1] = xor1 >>> 24 ^ xor0 << 8;
  ADD64AA(v$1, a, b);
  ADD64AC(v$1, a, y0, y1); // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits

  xor0 = v$1[d] ^ v$1[a];
  xor1 = v$1[d + 1] ^ v$1[a + 1];
  v$1[d] = xor0 >>> 16 ^ xor1 << 16;
  v$1[d + 1] = xor1 >>> 16 ^ xor0 << 16;
  ADD64AA(v$1, c, d); // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits

  xor0 = v$1[b] ^ v$1[c];
  xor1 = v$1[b + 1] ^ v$1[c + 1];
  v$1[b] = xor1 >>> 31 ^ xor0 << 1;
  v$1[b + 1] = xor0 >>> 31 ^ xor1 << 1;
} // Initialization Vector


var BLAKE2B_IV32 = new Uint32Array([0xF3BCC908, 0x6A09E667, 0x84CAA73B, 0xBB67AE85, 0xFE94F82B, 0x3C6EF372, 0x5F1D36F1, 0xA54FF53A, 0xADE682D1, 0x510E527F, 0x2B3E6C1F, 0x9B05688C, 0xFB41BD6B, 0x1F83D9AB, 0x137E2179, 0x5BE0CD19]);
var SIGMA8 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4, 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9, 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11, 13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10, 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5, 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3]; // These are offsets into a uint64 buffer.
// Multiply them all by 2 to make them offsets into a uint32 buffer,
// because this is Javascript and we don't have uint64s

var SIGMA82 = new Uint8Array(SIGMA8.map(function (x) {
  return x * 2;
})); // Compression function. 'last' flag indicates last block.
// Note we're representing 16 uint64s as 32 uint32s

var v$1 = new Uint32Array(32);
var m$1 = new Uint32Array(32);

function blake2bCompress(ctx, last) {
  var i = 0; // init work variables

  for (i = 0; i < 16; i++) {
    v$1[i] = ctx.h[i];
    v$1[i + 16] = BLAKE2B_IV32[i];
  } // low 64 bits of offset


  v$1[24] = v$1[24] ^ ctx.t;
  v$1[25] = v$1[25] ^ ctx.t / 0x100000000; // high 64 bits not supported, offset may not be higher than 2**53-1
  // last block flag set ?

  if (last) {
    v$1[28] = ~v$1[28];
    v$1[29] = ~v$1[29];
  } // get little-endian words


  for (i = 0; i < 32; i++) {
    m$1[i] = B2B_GET32(ctx.b, 4 * i);
  } // twelve rounds of mixing
  // uncomment the DebugPrint calls to log the computation
  // and match the RFC sample documentation
  // util.debugPrint('          m[16]', m, 64)


  for (i = 0; i < 12; i++) {
    // util.debugPrint('   (i=' + (i < 10 ? ' ' : '') + i + ') v[16]', v, 64)
    B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1]);
    B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3]);
    B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5]);
    B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7]);
    B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9]);
    B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11]);
    B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13]);
    B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15]);
  } // util.debugPrint('   (i=12) v[16]', v, 64)


  for (i = 0; i < 16; i++) {
    ctx.h[i] = ctx.h[i] ^ v$1[i] ^ v$1[i + 16];
  } // util.debugPrint('h[8]', ctx.h, 64)

} // Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key


function blake2bInit(outlen, key) {
  if (outlen === 0 || outlen > 64) {
    throw new Error('Illegal output length, expected 0 < length <= 64');
  }

  if (key && key.length > 64) {
    throw new Error('Illegal key, expected Uint8Array with 0 < length <= 64');
  } // state, 'param block'


  var ctx = {
    b: new Uint8Array(128),
    h: new Uint32Array(16),
    t: 0,
    // input count
    c: 0,
    // pointer within buffer
    outlen: outlen // output length in bytes

  }; // initialize hash state

  for (var i = 0; i < 16; i++) {
    ctx.h[i] = BLAKE2B_IV32[i];
  }

  var keylen = key ? key.length : 0;
  ctx.h[0] ^= 0x01010000 ^ keylen << 8 ^ outlen; // key the hash, if applicable

  if (key) {
    blake2bUpdate(ctx, key); // at the end

    ctx.c = 128;
  }

  return ctx;
} // Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)


function blake2bUpdate(ctx, input) {
  for (var i = 0; i < input.length; i++) {
    if (ctx.c === 128) {
      // buffer full ?
      ctx.t += ctx.c; // add counters

      blake2bCompress(ctx, false); // compress (not last)

      ctx.c = 0; // counter to zero
    }

    ctx.b[ctx.c++] = input[i];
  }
} // Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest


function blake2bFinal(ctx) {
  ctx.t += ctx.c; // mark last block offset

  while (ctx.c < 128) {
    // fill up with zeros
    ctx.b[ctx.c++] = 0;
  }

  blake2bCompress(ctx, true); // final block flag = 1
  // little endian convert and store

  var out = new Uint8Array(ctx.outlen);

  for (var i = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> 8 * (i & 3);
  }

  return out;
} // Computes the BLAKE2B hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64


function blake2b(input, key, outlen) {
  // preprocess inputs
  outlen = outlen || 64;
  input = util.normalizeInput(input); // do the math

  var ctx = blake2bInit(outlen, key);
  blake2bUpdate(ctx, input);
  return blake2bFinal(ctx);
} // Computes the BLAKE2B hash of a string or byte array
//
// Returns an n-byte hash in hex, all lowercase
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64


function blake2bHex(input, key, outlen) {
  var output = blake2b(input, key, outlen);
  return util.toHex(output);
}

var blake2b_1 = {
  blake2b: blake2b,
  blake2bHex: blake2bHex,
  blake2bInit: blake2bInit,
  blake2bUpdate: blake2bUpdate,
  blake2bFinal: blake2bFinal
};

// BLAKE2s hash function in pure Javascript
// Adapted from the reference implementation in RFC7693
// Ported to Javascript by DC - https://github.com/dcposch
 // Little-endian byte access.
// Expects a Uint8Array and an index
// Returns the little-endian uint32 at v[i..i+3]


function B2S_GET32(v, i) {
  return v[i] ^ v[i + 1] << 8 ^ v[i + 2] << 16 ^ v[i + 3] << 24;
} // Mixing function G.


function B2S_G(a, b, c, d, x, y) {
  v[a] = v[a] + v[b] + x;
  v[d] = ROTR32(v[d] ^ v[a], 16);
  v[c] = v[c] + v[d];
  v[b] = ROTR32(v[b] ^ v[c], 12);
  v[a] = v[a] + v[b] + y;
  v[d] = ROTR32(v[d] ^ v[a], 8);
  v[c] = v[c] + v[d];
  v[b] = ROTR32(v[b] ^ v[c], 7);
} // 32-bit right rotation
// x should be a uint32
// y must be between 1 and 31, inclusive


function ROTR32(x, y) {
  return x >>> y ^ x << 32 - y;
} // Initialization Vector.


var BLAKE2S_IV = new Uint32Array([0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19]);
var SIGMA = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4, 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9, 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11, 13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10, 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5, 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0]); // Compression function. "last" flag indicates last block

var v = new Uint32Array(16);
var m = new Uint32Array(16);

function blake2sCompress(ctx, last) {
  var i = 0;

  for (i = 0; i < 8; i++) {
    // init work variables
    v[i] = ctx.h[i];
    v[i + 8] = BLAKE2S_IV[i];
  }

  v[12] ^= ctx.t; // low 32 bits of offset

  v[13] ^= ctx.t / 0x100000000; // high 32 bits

  if (last) {
    // last block flag set ?
    v[14] = ~v[14];
  }

  for (i = 0; i < 16; i++) {
    // get little-endian words
    m[i] = B2S_GET32(ctx.b, 4 * i);
  } // ten rounds of mixing
  // uncomment the DebugPrint calls to log the computation
  // and match the RFC sample documentation
  // util.debugPrint('          m[16]', m, 32)


  for (i = 0; i < 10; i++) {
    // util.debugPrint('   (i=' + i + ')  v[16]', v, 32)
    B2S_G(0, 4, 8, 12, m[SIGMA[i * 16 + 0]], m[SIGMA[i * 16 + 1]]);
    B2S_G(1, 5, 9, 13, m[SIGMA[i * 16 + 2]], m[SIGMA[i * 16 + 3]]);
    B2S_G(2, 6, 10, 14, m[SIGMA[i * 16 + 4]], m[SIGMA[i * 16 + 5]]);
    B2S_G(3, 7, 11, 15, m[SIGMA[i * 16 + 6]], m[SIGMA[i * 16 + 7]]);
    B2S_G(0, 5, 10, 15, m[SIGMA[i * 16 + 8]], m[SIGMA[i * 16 + 9]]);
    B2S_G(1, 6, 11, 12, m[SIGMA[i * 16 + 10]], m[SIGMA[i * 16 + 11]]);
    B2S_G(2, 7, 8, 13, m[SIGMA[i * 16 + 12]], m[SIGMA[i * 16 + 13]]);
    B2S_G(3, 4, 9, 14, m[SIGMA[i * 16 + 14]], m[SIGMA[i * 16 + 15]]);
  } // util.debugPrint('   (i=10) v[16]', v, 32)


  for (i = 0; i < 8; i++) {
    ctx.h[i] ^= v[i] ^ v[i + 8];
  } // util.debugPrint('h[8]', ctx.h, 32)

} // Creates a BLAKE2s hashing context
// Requires an output length between 1 and 32 bytes
// Takes an optional Uint8Array key


function blake2sInit(outlen, key) {
  if (!(outlen > 0 && outlen <= 32)) {
    throw new Error('Incorrect output length, should be in [1, 32]');
  }

  var keylen = key ? key.length : 0;

  if (key && !(keylen > 0 && keylen <= 32)) {
    throw new Error('Incorrect key length, should be in [1, 32]');
  }

  var ctx = {
    h: new Uint32Array(BLAKE2S_IV),
    // hash state
    b: new Uint32Array(64),
    // input block
    c: 0,
    // pointer within block
    t: 0,
    // input count
    outlen: outlen // output length in bytes

  };
  ctx.h[0] ^= 0x01010000 ^ keylen << 8 ^ outlen;

  if (keylen > 0) {
    blake2sUpdate(ctx, key);
    ctx.c = 64; // at the end
  }

  return ctx;
} // Updates a BLAKE2s streaming hash
// Requires hash context and Uint8Array (byte array)


function blake2sUpdate(ctx, input) {
  for (var i = 0; i < input.length; i++) {
    if (ctx.c === 64) {
      // buffer full ?
      ctx.t += ctx.c; // add counters

      blake2sCompress(ctx, false); // compress (not last)

      ctx.c = 0; // counter to zero
    }

    ctx.b[ctx.c++] = input[i];
  }
} // Completes a BLAKE2s streaming hash
// Returns a Uint8Array containing the message digest


function blake2sFinal(ctx) {
  ctx.t += ctx.c; // mark last block offset

  while (ctx.c < 64) {
    // fill up with zeros
    ctx.b[ctx.c++] = 0;
  }

  blake2sCompress(ctx, true); // final block flag = 1
  // little endian convert and store

  var out = new Uint8Array(ctx.outlen);

  for (var i = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> 8 * (i & 3) & 0xFF;
  }

  return out;
} // Computes the BLAKE2S hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 32 bytes
// - outlen - optional output length in bytes, default 64


function blake2s(input, key, outlen) {
  // preprocess inputs
  outlen = outlen || 32;
  input = util.normalizeInput(input); // do the math

  var ctx = blake2sInit(outlen, key);
  blake2sUpdate(ctx, input);
  return blake2sFinal(ctx);
} // Computes the BLAKE2S hash of a string or byte array
//
// Returns an n-byte hash in hex, all lowercase
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 32 bytes
// - outlen - optional output length in bytes, default 64


function blake2sHex(input, key, outlen) {
  var output = blake2s(input, key, outlen);
  return util.toHex(output);
}

var blake2s_1 = {
  blake2s: blake2s,
  blake2sHex: blake2sHex,
  blake2sInit: blake2sInit,
  blake2sUpdate: blake2sUpdate,
  blake2sFinal: blake2sFinal
};

var blakejs = {
  blake2b: blake2b_1.blake2b,
  blake2bHex: blake2b_1.blake2bHex,
  blake2bInit: blake2b_1.blake2bInit,
  blake2bUpdate: blake2b_1.blake2bUpdate,
  blake2bFinal: blake2b_1.blake2bFinal,
  blake2s: blake2s_1.blake2s,
  blake2sHex: blake2s_1.blake2sHex,
  blake2sInit: blake2s_1.blake2sInit,
  blake2sUpdate: blake2s_1.blake2sUpdate,
  blake2sFinal: blake2s_1.blake2sFinal
};

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
/**
 * @name blake2AsU8a
 * @summary Creates a blake2b u8a from the input.
 * @description
 * From a `Uint8Array` input, create the blake2b and return the result as a u8a with the specified `bitLength`.
 * @example
 * <BR>
 *
 * ```javascript
 * import { blake2AsU8a } from '@polkadot/util-crypto';
 *
 * blake2AsU8a('abc'); // => [0xba, 0x80, 0xa53, 0xf98, 0x1c, 0x4d, 0x0d]
 * ```
 */

function blake2AsU8a(data, bitLength = 256, key = null, onlyJs = false) {
  const byteLength = Math.ceil(bitLength / 8);
  return blakejs.blake2b(u8aToU8a(data), key, byteLength);
}

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
const SS58_PREFIX = stringToU8a('SS58PRE');
function sshash(key) {
  return blake2AsU8a(u8aConcat(SS58_PREFIX, key), 512);
}

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
function checkAddressChecksum(decoded) {
  const ss58Length = decoded[0] & 0b01000000 ? 2 : 1;
  const ss58Decoded = ss58Length === 1 ? decoded[0] : (decoded[0] & 0b00111111) << 2 | decoded[1] >> 6 | (decoded[1] & 0b00111111) << 8; // 32/33 bytes public + 2 bytes checksum + prefix

  const isPublicKey = [34 + ss58Length, 35 + ss58Length].includes(decoded.length);
  const length = decoded.length - (isPublicKey ? 2 : 1); // calculate the hash and do the checksum byte checks

  const hash = sshash(decoded.subarray(0, length));
  const isValid = (decoded[0] & 0b10000000) === 0 && ![46, 47].includes(decoded[0]) && (isPublicKey ? decoded[decoded.length - 2] === hash[0] && decoded[decoded.length - 1] === hash[1] : decoded[decoded.length - 1] === hash[0]);
  return [isValid, length, ss58Length, ss58Decoded];
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
} // Copyright 2017-2021 @polkadot/networks authors & contributors

const UNSORTED = [0, 2, 42]; // NOTE: In the case where the network was hard-spooned and multiple genesisHashes
// are provided, it needs to be in reverse order, i.e. most-recent first, oldest
// last. This make lookups for the current a simple genesisHash[0]
// (See Kusama as an example)

const createReserved = (prefix, displayName, network = null) => ({
  decimals: null,
  displayName,
  isIgnored: true,
  network,
  prefix,
  standardAccount: null,
  symbols: null,
  website: null
});

const all = [{
  decimals: [10],
  displayName: 'Polkadot Relay Chain',
  genesisHash: ['0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'],
  hasLedgerSupport: true,
  icon: 'polkadot',
  network: 'polkadot',
  prefix: 0,
  slip44: 0x00000162,
  standardAccount: '*25519',
  symbols: ['DOT'],
  website: 'https://polkadot.network'
}, createReserved(1, 'Bare 32-bit Schnorr/Ristretto (S/R 25519) public key.'), {
  decimals: [12],
  displayName: 'Kusama Relay Chain',
  genesisHash: ['0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe', // Kusama CC3,
  '0xe3777fa922cafbff200cadeaea1a76bd7898ad5b89f7848999058b50e715f636', // Kusama CC2
  '0x3fd7b9eb6a00376e5be61f01abb429ffb0b104be05eaff4d458da48fcd425baf' // Kusama CC1
  ],
  hasLedgerSupport: true,
  icon: 'polkadot',
  network: 'kusama',
  prefix: 2,
  slip44: 0x000001b2,
  standardAccount: '*25519',
  symbols: ['KSM'],
  website: 'https://kusama.network'
}, createReserved(3, 'Bare 32-bit Ed25519 public key.'), {
  decimals: null,
  displayName: 'Katal Chain',
  network: 'katalchain',
  prefix: 4,
  standardAccount: '*25519',
  symbols: null,
  website: null
}, {
  decimals: null,
  displayName: 'Plasm Network',
  genesisHash: ['0x3e86364d4b4894021cb2a0390bcf2feb5517d5292f2de2bb9404227e908b0b8b'],
  network: 'plasm',
  prefix: 5,
  standardAccount: '*25519',
  symbols: ['PLM'],
  website: null
}, {
  decimals: [12],
  displayName: 'Bifrost',
  network: 'bifrost',
  prefix: 6,
  standardAccount: '*25519',
  symbols: ['BNC'],
  website: 'https://bifrost.finance/'
}, {
  decimals: [18],
  displayName: 'Edgeware',
  genesisHash: ['0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b'],
  network: 'edgeware',
  prefix: 7,
  standardAccount: '*25519',
  symbols: ['EDG'],
  website: 'https://edgewa.re'
}, {
  decimals: [18],
  displayName: 'Acala Karura Canary',
  network: 'karura',
  prefix: 8,
  standardAccount: '*25519',
  symbols: ['KAR'],
  website: 'https://acala.network/'
}, {
  decimals: [18],
  displayName: 'Laminar Reynolds Canary',
  network: 'reynolds',
  prefix: 9,
  standardAccount: '*25519',
  symbols: ['REY'],
  website: 'http://laminar.network/'
}, {
  decimals: [18],
  displayName: 'Acala',
  network: 'acala',
  prefix: 10,
  standardAccount: '*25519',
  symbols: ['ACA'],
  website: 'https://acala.network/'
}, {
  decimals: [18],
  displayName: 'Laminar',
  network: 'laminar',
  prefix: 11,
  standardAccount: '*25519',
  symbols: ['LAMI'],
  website: 'http://laminar.network/'
}, {
  decimals: [6],
  displayName: 'Polymesh',
  genesisHash: ['0x12fddc9e2128b3fe571e4e5427addcb87fcaf08493867a68dd6ae44b406b39c7'],
  hasLedgerSupport: true,
  network: 'polymesh',
  prefix: 12,
  slip44: 0x00000253,
  standardAccount: '*25519',
  symbols: ['POLYX'],
  website: 'https://polymath.network/'
}, {
  decimals: null,
  displayName: 'SubstraTEE',
  network: 'substratee',
  prefix: 13,
  standardAccount: '*25519',
  symbols: null,
  website: 'https://www.substratee.com'
}, {
  decimals: [0],
  displayName: 'Totem',
  network: 'totem',
  prefix: 14,
  standardAccount: '*25519',
  symbols: ['XTX'],
  website: 'https://totemaccounting.com'
}, {
  decimals: [12],
  displayName: 'Synesthesia',
  network: 'synesthesia',
  prefix: 15,
  standardAccount: '*25519',
  symbols: ['SYN'],
  website: 'https://synesthesia.network/'
}, {
  decimals: [12],
  displayName: 'Kulupu',
  genesisHash: ['0xf7a99d3cb92853d00d5275c971c132c074636256583fee53b3bbe60d7b8769ba'],
  network: 'kulupu',
  prefix: 16,
  standardAccount: '*25519',
  symbols: ['KLP'],
  website: 'https://kulupu.network/'
}, {
  decimals: null,
  displayName: 'Dark Mainnet',
  network: 'dark',
  prefix: 17,
  standardAccount: '*25519',
  symbols: null,
  website: null
}, {
  decimals: [9, 9],
  displayName: 'Darwinia Network',
  network: 'darwinia',
  prefix: 18,
  standardAccount: '*25519',
  symbols: ['RING', 'KTON'],
  website: 'https://darwinia.network/'
}, {
  decimals: [12],
  displayName: 'GeekCash',
  network: 'geek',
  prefix: 19,
  standardAccount: '*25519',
  symbols: ['GEEK'],
  website: 'https://geekcash.org'
}, {
  decimals: [12],
  displayName: 'Stafi',
  genesisHash: ['0x290a4149f09ea0e402c74c1c7e96ae4239588577fe78932f94f5404c68243d80'],
  network: 'stafi',
  prefix: 20,
  standardAccount: '*25519',
  symbols: ['FIS'],
  website: 'https://stafi.io'
}, {
  decimals: [6],
  displayName: 'Dock Testnet',
  isIgnored: true,
  // testnet
  network: 'dock-testnet',
  prefix: 21,
  standardAccount: '*25519',
  symbols: ['DCK'],
  website: 'https://dock.io'
}, {
  decimals: [6],
  displayName: 'Dock Mainnet',
  genesisHash: ['0xf73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a9'],
  hasLedgerSupport: true,
  network: 'dock-mainnet',
  prefix: 22,
  slip44: 0x00000252,
  standardAccount: '*25519',
  symbols: ['DCK'],
  website: 'https://dock.io'
}, {
  decimals: null,
  displayName: 'ShiftNrg',
  network: 'shift',
  prefix: 23,
  standardAccount: '*25519',
  symbols: null,
  website: null
}, {
  decimals: [18],
  displayName: 'ZERO',
  network: 'zero',
  prefix: 24,
  standardAccount: '*25519',
  symbols: ['PLAY'],
  website: 'https://zero.io'
}, {
  decimals: [18],
  displayName: 'ZERO Alphaville',
  isIgnored: true,
  // testnet
  network: 'zero-alphaville',
  prefix: 25,
  standardAccount: '*25519',
  symbols: ['PLAY'],
  website: 'https://zero.io'
}, {
  decimals: [10],
  displayName: 'Jupiter',
  isIgnored: true,
  // testnet
  network: 'jupiter',
  prefix: 26,
  standardAccount: '*25519',
  symbols: ['jDOT'],
  website: 'https://jupiter.patract.io'
}, {
  decimals: [10, 12],
  displayName: 'Patract',
  network: 'patract',
  prefix: 27,
  standardAccount: '*25519',
  symbols: ['pDOT', 'pKSM'],
  website: 'https://patract.network'
}, {
  decimals: null,
  displayName: 'Subsocial',
  genesisHash: ['0x0bd72c1c305172e1275278aaeb3f161e02eccb7a819e63f62d47bd53a28189f8'],
  network: 'subsocial',
  prefix: 28,
  standardAccount: '*25519',
  symbols: null,
  website: null
}, {
  decimals: [18],
  displayName: 'Dhiway CORD Network',
  network: 'cord',
  prefix: 29,
  standardAccount: '*25519',
  symbols: ['DCU'],
  website: 'https://dhiway.com/'
}, {
  decimals: [12],
  displayName: 'Phala Network',
  network: 'phala',
  prefix: 30,
  standardAccount: '*25519',
  symbols: ['PHA'],
  website: 'https://phala.network'
}, {
  decimals: [12],
  displayName: 'Litentry Network',
  network: 'litentry',
  prefix: 31,
  standardAccount: '*25519',
  symbols: ['LIT'],
  website: 'https://litentry.com/'
}, {
  decimals: [9],
  displayName: 'Robonomics',
  network: 'robonomics',
  prefix: 32,
  standardAccount: '*25519',
  symbols: ['XRT'],
  website: 'https://robonomics.network'
}, {
  decimals: null,
  displayName: 'DataHighway',
  network: 'datahighway',
  prefix: 33,
  standardAccount: '*25519',
  symbols: null,
  website: null
}, {
  decimals: [12],
  displayName: 'Ares Protocol',
  network: 'ares',
  prefix: 34,
  standardAccount: '*25519',
  symbols: ['ARES'],
  website: 'https://www.aresprotocol.com/'
}, {
  decimals: [15],
  displayName: 'Valiu Liquidity Network',
  network: 'vln',
  prefix: 35,
  standardAccount: '*25519',
  symbols: ['USDv'],
  website: 'https://valiu.com/'
}, {
  decimals: [18],
  displayName: 'Centrifuge Chain',
  network: 'centrifuge',
  prefix: 36,
  standardAccount: '*25519',
  symbols: ['RAD'],
  website: 'https://centrifuge.io/'
}, {
  decimals: [18],
  displayName: 'Nodle Chain',
  network: 'nodle',
  prefix: 37,
  standardAccount: '*25519',
  symbols: ['NODL'],
  website: 'https://nodle.io/'
}, {
  decimals: [18],
  displayName: 'KILT Chain',
  network: 'kilt',
  prefix: 38,
  standardAccount: '*25519',
  symbols: ['KILT'],
  website: 'https://kilt.io/'
}, {
  decimals: [18],
  displayName: 'MathChain mainnet',
  network: 'mathchain',
  prefix: 39,
  standardAccount: '*25519',
  symbols: ['MATH'],
  website: 'https://mathwallet.org'
}, {
  decimals: [18],
  displayName: 'MathChain testnet',
  isIgnored: true,
  // testnet
  network: 'mathchain-testnet',
  prefix: 40,
  standardAccount: '*25519',
  symbols: ['MATH'],
  website: 'https://mathwallet.org'
}, {
  decimals: null,
  displayName: 'Polimec Chain',
  network: 'poli',
  prefix: 41,
  standardAccount: '*25519',
  symbols: null,
  website: 'https://polimec.io/'
}, {
  decimals: null,
  displayName: 'Substrate',
  network: 'substrate',
  prefix: 42,
  standardAccount: '*25519',
  symbols: null,
  website: 'https://substrate.dev/'
}, createReserved(43, 'Bare 32-bit ECDSA SECP-256k1 public key.'), {
  decimals: [8],
  displayName: 'ChainX',
  network: 'chainx',
  prefix: 44,
  standardAccount: '*25519',
  symbols: ['PCX'],
  website: 'https://chainx.org/'
}, {
  decimals: [12, 12],
  displayName: 'UniArts Network',
  network: 'uniarts',
  prefix: 45,
  standardAccount: '*25519',
  symbols: ['UART', 'UINK'],
  website: 'https://uniarts.me'
}, createReserved(46, 'This prefix is reserved.', 'reserved46'), createReserved(47, 'This prefix is reserved.', 'reserved47'), {
  decimals: [12],
  displayName: 'Neatcoin Mainnet',
  network: 'neatcoin',
  prefix: 48,
  standardAccount: '*25519',
  symbols: ['NEAT'],
  website: 'https://neatcoin.org'
}, {
  decimals: [12],
  displayName: 'HydraDX',
  network: 'hydradx',
  prefix: 63,
  standardAccount: '*25519',
  symbols: ['HDX'],
  website: 'https://hydradx.io'
}, {
  decimals: [18],
  displayName: 'AvN Mainnet',
  network: 'aventus',
  prefix: 65,
  standardAccount: '*25519',
  symbols: ['AVT'],
  website: 'https://aventus.io'
}, {
  decimals: [12],
  displayName: 'Crust Network',
  network: 'crust',
  prefix: 66,
  standardAccount: '*25519',
  symbols: ['CRU'],
  website: 'https://crust.network'
}]; // The list of available/claimed prefixes
//   - no testnets
//   - we only include those where we have a standardAccount
//   - when no icon has been specified, default to substrate
//   - sort by name, however we keep 0, 2, 42 first in the list

const available = all.filter(n => !n.isIgnored && !!n.network).map(n => _objectSpread(_objectSpread({}, n), {}, {
  genesisHash: n.genesisHash || [],
  icon: n.icon || 'substrate'
})).sort((a, b) => UNSORTED.includes(a.prefix) && UNSORTED.includes(b.prefix) ? 0 : UNSORTED.includes(a.prefix) ? -1 : UNSORTED.includes(b.prefix) ? 1 : a.displayName.localeCompare(b.displayName)); // A filtered list of those chains we have details about (genesisHashes)

available.filter(n => n.genesisHash.length || n.prefix === 42);

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
const defaults = {
  allowedDecodedLengths: [1, 2, 4, 8, 32, 33],
  // publicKey has prefix + 2 checksum bytes, short only prefix + 1 checksum byte
  allowedEncodedLengths: [3, 4, 6, 10, 35, 36, 37, 38],
  allowedPrefix: available.map(({
    prefix
  }) => prefix),
  prefix: 42
};

// Copyright 2017-2021 @polkadot/util-crypto authors & contributors
function decodeAddress(encoded, ignoreChecksum, ss58Format = -1) {
  if (isU8a(encoded) || isHex(encoded)) {
    return u8aToU8a(encoded);
  }

  try {
    const decoded = base58Decode(encoded);
    assert(defaults.allowedEncodedLengths.includes(decoded.length), 'Invalid decoded address length');
    const [isValid, endPos, ss58Length, ss58Decoded] = checkAddressChecksum(decoded);
    assert(ignoreChecksum || isValid, 'Invalid decoded address checksum');
    assert([-1, ss58Decoded].includes(ss58Format), `Expected ss58Format ${ss58Format}, received ${ss58Decoded}`);
    return decoded.slice(ss58Length, endPos);
  } catch (error) {
    throw new Error(`Decoding ${encoded}: ${error.message}`);
  }
}

const deeplog = function (obj) {
    console.log(JSON.stringify(obj, null, 2));
};

var OP_TYPES;
(function (OP_TYPES) {
    OP_TYPES["BUY"] = "BUY";
    OP_TYPES["LIST"] = "LIST";
    OP_TYPES["MINT"] = "MINT";
    OP_TYPES["MINTNFT"] = "MINTNFT";
    OP_TYPES["SEND"] = "SEND";
    OP_TYPES["EMOTE"] = "EMOTE";
    OP_TYPES["CHANGEISSUER"] = "CHANGEISSUER";
})(OP_TYPES || (OP_TYPES = {}));

// import * as fs from "fs";
class Consolidator {
    constructor(initializedAdapter) {
        this.adapter = initializedAdapter;
        this.invalidCalls = [];
        this.collections = [];
        this.nfts = [];
    }
    findExistingCollection(id) {
        return this.collections.find((el) => el.id === id);
    }
    updateInvalidCalls(op_type, remark) {
        const invalidCallBase = {
            op_type,
            block: remark.block,
            caller: remark.caller,
        };
        return function update(object_id, message) {
            this.invalidCalls.push(Object.assign(Object.assign({}, invalidCallBase), { object_id,
                message }));
        };
    }
    mint(remark) {
        // A new collection was created
        console.log("Instantiating collection");
        const invalidate = this.updateInvalidCalls(OP_TYPES.MINT, remark).bind(this);
        const c = Collection.fromRemark(remark.remark, remark.block);
        if (typeof c === "string") {
            // console.log(
            //   "Collection was not instantiated OK from " + remark.remark
            // );
            invalidate(remark.remark, `[${OP_TYPES.MINT}] Dead before instantiation: ${c}`);
            return true;
        }
        //console.log("Collection instantiated OK from " + remark.remark);
        const pubkey = decodeAddress(remark.caller);
        const id = Collection.generateId(u8aToHex(pubkey), c.symbol);
        if (this.findExistingCollection(c.id)) {
            invalidate(c.id, `[${OP_TYPES.MINT}] Attempt to mint already existing collection`);
            return true;
        }
        if (id.toLowerCase() !== c.id.toLowerCase()) {
            invalidate(c.id, `Caller's pubkey ${u8aToHex(pubkey)} (${id}) does not match generated ID`);
            return true;
        }
        this.collections.push(c);
        return false;
    }
    mintNFT(remark) {
        // A new NFT was minted into a collection
        console.log("Instantiating nft");
        const invalidate = this.updateInvalidCalls(OP_TYPES.MINTNFT, remark).bind(this);
        const n = NFT.fromRemark(remark.remark, remark.block);
        if (typeof n === "string") {
            invalidate(remark.remark, `[${OP_TYPES.MINTNFT}] Dead before instantiation: ${n}`);
            return true;
        }
        const nftParent = this.findExistingCollection(n.collection);
        if (!nftParent) {
            invalidate(n.getId(), `NFT referencing non-existant parent collection ${n.collection}`);
            return true;
        }
        n.owner = nftParent.issuer;
        if (remark.caller != n.owner) {
            invalidate(n.getId(), `Attempted issue of NFT in non-owned collection. Issuer: ${nftParent.issuer}, caller: ${remark.caller}`);
            return true;
        }
        const existsCheck = this.nfts.find((el) => {
            const idExpand1 = el.getId().split("-");
            idExpand1.shift();
            const uniquePart1 = idExpand1.join("-");
            const idExpand2 = n.getId().split("-");
            idExpand2.shift();
            const uniquePart2 = idExpand2.join("-");
            return uniquePart1 === uniquePart2;
        });
        if (existsCheck) {
            invalidate(n.getId(), `[${OP_TYPES.MINTNFT}] Attempt to mint already existing NFT`);
            return true;
        }
        if (n.owner === "") {
            invalidate(n.getId(), `[${OP_TYPES.MINTNFT}] Somehow this NFT still doesn't have an owner.`);
            return true;
        }
        this.nfts.push(n);
        return false;
    }
    send(remark) {
        // An NFT was sent to a new owner
        console.log("Instantiating send");
        const send = Send.fromRemark(remark.remark);
        const invalidate = this.updateInvalidCalls(OP_TYPES.SEND, remark).bind(this);
        if (typeof send === "string") {
            invalidate(remark.remark, `[${OP_TYPES.SEND}] Dead before instantiation: ${send}`);
            return true;
        }
        const nft = this.nfts.find((el) => {
            const idExpand1 = el.getId().split("-");
            idExpand1.shift();
            const uniquePart1 = idExpand1.join("-");
            const idExpand2 = send.id.split("-");
            idExpand2.shift();
            const uniquePart2 = idExpand2.join("-");
            return uniquePart1 === uniquePart2;
        });
        // @todo add condition for transferable!
        if (!nft) {
            invalidate(send.id, `[${OP_TYPES.SEND}] Attempting to send non-existant NFT ${send.id}`);
            return true;
        }
        // Check if allowed to issue send - if owner == caller
        if (nft.owner != remark.caller) {
            invalidate(send.id, `[${OP_TYPES.SEND}] Attempting to send non-owned NFT ${send.id}, real owner: ${nft.owner}`);
            return true;
        }
        nft.addChange({
            field: "owner",
            old: nft.owner,
            new: send.recipient,
            caller: remark.caller,
            block: remark.block,
        });
        nft.owner = send.recipient;
        return false;
    }
    emote(remark) {
        // An EMOTE reaction has been sent
        console.log("Instantiating emote");
        const emote = Emote.fromRemark(remark.remark);
        const invalidate = this.updateInvalidCalls(OP_TYPES.EMOTE, remark).bind(this);
        if (typeof emote === "string") {
            invalidate(remark.remark, `[${OP_TYPES.EMOTE}] Dead before instantiation: ${emote}`);
            return true;
        }
        const target = this.nfts.find((el) => el.getId() === emote.id);
        if (!target) {
            invalidate(emote.id, `[${OP_TYPES.EMOTE}] Attempting to emote on non-existant NFT ${emote.id}`);
            return true;
        }
        const index = target.reactions[emote.unicode].indexOf(remark.caller, 0);
        if (index > -1) {
            target.reactions[emote.unicode].splice(index, 1);
        }
        else {
            target.reactions[emote.unicode].push(remark.caller);
        }
        return false;
    }
    changeIssuer(remark) {
        // The ownership of a collection has changed
        console.log("Instantiating an issuer change");
        const ci = ChangeIssuer.fromRemark(remark.remark);
        const invalidate = this.updateInvalidCalls(OP_TYPES.CHANGEISSUER, remark).bind(this);
        if (typeof ci === "string") {
            // console.log(
            //   "ChangeIssuer was not instantiated OK from " + remark.remark
            // );
            invalidate(remark.remark, `[${OP_TYPES.CHANGEISSUER}] Dead before instantiation: ${ci}`);
            return true;
        }
        const coll = this.collections.find((el) => el.id === ci.id);
        if (!coll) {
            invalidate(ci.id, `This ${OP_TYPES.CHANGEISSUER} remark is invalid - no such collection with ID ${ci.id} found before block ${remark.block}!`);
            return true;
        }
        if (remark.caller != coll.issuer) {
            invalidate(ci.id, `Attempting to change issuer of collection ${ci.id} when not issuer!`);
            return true;
        }
        coll.addChange({
            field: "issuer",
            old: coll.issuer,
            new: ci.issuer,
            caller: remark.caller,
            block: remark.block,
        });
        coll.issuer = ci.issuer;
        return false;
    }
    consolidate() {
        const remarks = this.adapter.getRemarks();
        //console.log(remarks);
        for (const remark of remarks) {
            console.log("==============================");
            console.log("Remark is: " + remark.remark);
            switch (remark.interaction_type) {
                case OP_TYPES.MINT:
                    if (this.mint(remark)) {
                        continue;
                    }
                    break;
                case OP_TYPES.MINTNFT:
                    if (this.mintNFT(remark)) {
                        continue;
                    }
                    break;
                case OP_TYPES.SEND:
                    if (this.send(remark)) {
                        continue;
                    }
                    break;
                case OP_TYPES.BUY:
                    // An NFT was bought after being LISTed
                    break;
                case OP_TYPES.LIST:
                    // An NFT was listed for sale
                    break;
                case OP_TYPES.EMOTE:
                    if (this.emote(remark)) {
                        continue;
                    }
                    break;
                case OP_TYPES.CHANGEISSUER:
                    if (this.changeIssuer(remark)) {
                        continue;
                    }
                    break;
                default:
                    console.error("Unable to process this remark - wrong type: " +
                        remark.interaction_type);
            }
        }
        deeplog(this.nfts);
        deeplog(this.collections);
        console.log(this.invalidCalls);
    }
}

exports.c100 = Collection;
exports.consolidator = Consolidator;
exports.n100 = NFT;
//# sourceMappingURL=index.js.map
