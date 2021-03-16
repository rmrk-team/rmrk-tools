import { blocks489x_630x } from "../mocks/blocks-dump";
import {
  getRemarksFromBlocks,
  stringIsAValidUrl,
  prefixToArray,
  isSystemRemark,
  isUtilityBatch,
  getRemarkData,
} from "../../src/tools/utils";
import { Call as TCall } from "@polkadot/types/interfaces";

// Test getRemarksFromBlocks
describe("utils: getRemarksFromBlocks", () => {
  it("should return remarks from blocks", () => {
    expect(getRemarksFromBlocks(blocks489x_630x)).toMatchSnapshot();
  });
});

describe("utils: stringIsAValidUrl", () => {
  it("should check if string is a URL and return true", () => {
    expect(stringIsAValidUrl("https://rmrk.app/")).toBeTruthy();
  });
});

describe("utils: stringIsAValidUrl", () => {
  it("should check if string is a URL and return false", () => {
    expect(stringIsAValidUrl("wrong url")).toBeFalsy();
  });
});

describe("utils: prefixToArray", () => {
  it("should take prefix string and split it into an array", () => {
    expect(prefixToArray("0x726d726b,0x524d524b")).toEqual([
      "0x726d726b",
      "0x524d524b",
    ]);
  });
});

describe("utils: prefixToArray", () => {
  it("should take prefix string and split it into an array and convert string to hex", () => {
    expect(prefixToArray("0x726d726b,RMRK")).toEqual([
      "0x726d726b",
      "0x524d524b",
    ]);
  });
});

describe("utils: isSystemRemark", () => {
  it("should check if passed data is a remark and return a boolean - true", () => {
    expect(
      isSystemRemark(
        {
          args: ["0x726d726b", "0x524d524b"],
          section: "system",
          method: "remark",
        } as any,
        ["0x726d726b", "0x524d524b"]
      )
    ).toBeTruthy();
  });
});

describe("utils: isSystemRemark", () => {
  it("should check if passed data is a remark and return a boolean - false", () => {
    expect(
      isSystemRemark(
        {
          args: "",
          section: "system",
          method: "",
        } as any,
        ["0x726d726b", "0x524d524b"]
      )
    ).toBeFalsy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - true", () => {
    expect(
      isUtilityBatch({
        section: "utility",
        method: "batch",
      } as TCall)
    ).toBeTruthy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - true", () => {
    expect(
      isUtilityBatch({
        section: "utility",
        method: "batchAll",
      } as TCall)
    ).toBeTruthy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - false", () => {
    expect(
      isUtilityBatch({
        section: "remark",
        method: "batchAll",
      } as TCall)
    ).toBeFalsy();
  });
});

describe("utils: isUtilityBatch", () => {
  it("should check if passed a utility and return a boolean - false", () => {
    expect(
      isUtilityBatch({
        section: "utility",
        method: "wrong",
      } as TCall)
    ).toBeFalsy();
  });
});

describe("utils: getRemarkData", () => {
  it("should take a remark string and turn into json", () => {
    const remark =
      '{"collection"%3A"241B8516516F381A-OKSM"%2C"name"%3A"Kusama Octahedron"%2C"transferable"%3A1%2C"sn"%3A"0000000000000004"%2C"metadata"%3A"ipfs%3A//ipfs/QmXwp5VsPmTdWvFKmc9VwnFkp9jN6ktFiKc5tSMHCuN4pW"}';
    expect(getRemarkData(remark)).toMatchSnapshot();
  });
});
