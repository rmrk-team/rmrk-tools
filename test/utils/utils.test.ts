import { blocks489x_630x } from "../mocks/blocks-dump";
import {
  getRemarksFromBlocks,
  stringIsAValidUrl,
  prefixToArray,
  isSystemRemark,
} from "../../src/tools/utils";
import { Call as TCall } from "@polkadot/types/interfaces";

// Test getRemarksFromBlocks
describe("utils: getRemarksFromBlocks", () => {
  it("should return remarks from blocks", () => {
    expect(getRemarksFromBlocks(blocks489x_630x)).toMatchSnapshot();
  });
});

// Test stringIsAValidUrl
const testUrls = {
  url: "https://rmrk.app/",
  wrongUrl: "wrong url",
};

describe("utils: stringIsAValidUrl", () => {
  it("should check if string is a URL and return true", () => {
    expect(stringIsAValidUrl(testUrls.url)).toBeTruthy();
  });
});

describe("utils: stringIsAValidUrl", () => {
  it("should check if string is a URL and return false", () => {
    expect(stringIsAValidUrl(testUrls.wrongUrl)).toBeFalsy();
  });
});

// Test prefixToArray
const testPrefixes = {
  prefix: "0x726d726b,0x524d524b",
  prefix2: "0x726d726b,RMRK",
};

describe("utils: prefixToArray", () => {
  it("should take prefix string and split it into an array", () => {
    expect(prefixToArray(testPrefixes.prefix)).toEqual([
      "0x726d726b",
      "0x524d524b",
    ]);
  });
});

describe("utils: prefixToArray", () => {
  it("should take prefix string and split it into an array and convert string to hex", () => {
    expect(prefixToArray(testPrefixes.prefix2)).toEqual([
      "0x726d726b",
      "0x524d524b",
    ]);
  });
});

// Test isSystemRemark

const isRemark = {
  call: {
    args: ["0x726d726b", "0x524d524b"],
    section: "system",
    method: "remark",
  },

  call2: {
    args: "",
    section: "system",
    method: "",
  },
  prefixes: ["0x726d726b", "0x524d524b"],
};

describe("utils: isSystemRemark", () => {
  it("should check if passed data is a remark and return a boolean - true", () => {
    expect(
      isSystemRemark(isRemark.call as any, isRemark.prefixes)
    ).toBeTruthy();
  });
});

describe("utils: isSystemRemark", () => {
  it("should check if passed data is a remark and return a boolean - false", () => {
    expect(
      isSystemRemark(isRemark.call2 as any, isRemark.prefixes)
    ).toBeFalsy();
  });
});
