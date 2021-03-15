import { blocks } from "../mocks/blocks";
import { getRemarksFromBlocks } from "../../src/tools/utils";

describe("utils: getRemarksFromBlocks", () => {
  it("should return remarks from blocks", () => {
    expect(getRemarksFromBlocks(blocks)).toMatchSnapshot();
  });
});
