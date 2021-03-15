import { blocks } from "../mocks/blocks";
import { getRemarksFromBlocks, stringIsAValidUrl } from "../../src/tools/utils";

describe("utils: getRemarksFromBlocks", () => {
  it("should return remarks from blocks", () => {
    expect(getRemarksFromBlocks(blocks)).toMatchSnapshot();
  });
});

const testUrls: Record<string, string> = {
  url: 'https://rmrk.app/',
  wrongUrl: 'wrong url',
}

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
