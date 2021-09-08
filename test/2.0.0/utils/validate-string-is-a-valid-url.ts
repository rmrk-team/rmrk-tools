import { stringIsAValidUrl } from "../../../src/rmrk2.0.0/tools/utils";

const testUrl = 'https://rmrk.app/';

describe("utils: stringIsAValidUrl", () => {
  it("should check if string is a URL and return a boolean", () => {
    expect(stringIsAValidUrl(testUrl)).toEqual(true);
  });
});
