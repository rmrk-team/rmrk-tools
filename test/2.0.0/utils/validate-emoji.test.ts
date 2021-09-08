import { isValidEmoji } from "../../../src/rmrk2.0.0/tools/validate-emoji";

describe("validation: isValidEmoji", () => {
  it("should be valid", () => {
    expect(isValidEmoji("1F601")).toBeTruthy();
    expect(isValidEmoji("U+2764-U+FE0F-U+200D-U+1F525")).toBeTruthy();
    expect(isValidEmoji("2764-FE0F-200D-1F525")).toBeTruthy();
    expect(isValidEmoji("U+2764 U+FE0F U+200D U+1F525")).toBeTruthy();
  });

  it("should be invalid", () => {
    expect(isValidEmoji("U+1dff601")).toBeFalsy();
    expect(isValidEmoji("foo")).toBeFalsy();
    expect(isValidEmoji("u+foo")).toBeFalsy();
  });
});
