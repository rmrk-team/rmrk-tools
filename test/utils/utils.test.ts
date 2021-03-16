import { blocks489x_630x } from "../mocks/blocks-dump";
import {
  getRemarksFromBlocks,
  stringIsAValidUrl,
  prefixToArray,
  isSystemRemark,
  isUtilityBatch,
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

const isSystemRemarkTestData = {
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
      isSystemRemark(
        isSystemRemarkTestData.call as any,
        isSystemRemarkTestData.prefixes
      )
    ).toBeTruthy();
  });
});

describe("utils: isSystemRemark", () => {
  it("should check if passed data is a remark and return a boolean - false", () => {
    expect(
      isSystemRemark(
        isSystemRemarkTestData.call2 as any,
        isSystemRemarkTestData.prefixes
      )
    ).toBeFalsy();
  });
});

// Test isSystemRemark
const isUtilityBatchTestData = {
  call: {
    section: "utility",
    method: "batch",
  },
  call2: {
    section: "utility",
    method: "batchAll",
  },
  call3: {
    section: "remark",
    method: "batchAll",
  },
  call4: {
    section: "utility",
    method: "wrong",
  },
};

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - true", () => {
    expect(isUtilityBatch(isUtilityBatchTestData.call as TCall)).toBeTruthy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - true", () => {
    expect(isUtilityBatch(isUtilityBatchTestData.call2 as TCall)).toBeTruthy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - false", () => {
    expect(isUtilityBatch(isUtilityBatchTestData.call3 as TCall)).toBeFalsy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - false", () => {
    expect(isUtilityBatch(isUtilityBatchTestData.call4 as TCall)).toBeFalsy();
  });
});
