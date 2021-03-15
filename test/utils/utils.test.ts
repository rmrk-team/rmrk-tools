import { blocks } from "../mocks/blocks";
import {
  getRemarksFromBlocks,
  stringIsAValidUrl,
  prefixToArray,
} from "../../src/tools/utils";

// Test getRemarksFromBlocks
describe("utils: getRemarksFromBlocks", () => {
  it("should return remarks from blocks", () => {
    expect(getRemarksFromBlocks(blocks)).toMatchSnapshot();
  });
});

// Test stringIsAValidUrl
const testUrls: Record<string, string> = {
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
describe("utils: prefixToArray", () => {
  it("should check if string is a URL and return true", () => {
    expect(prefixToArray(testUrls.url)).toBeTruthy();
  });
});
