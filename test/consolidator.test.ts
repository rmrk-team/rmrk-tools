import { Consolidator } from "../src";
import { getRemarksFromBlocks } from "../src/tools/utils";
import {
  blocks489x_630x,
  blocks630x_647x,
  blocks647x_661x,
} from "./mocks/blocks";

describe("tools: Consolidator", () => {
  it("should run consolidation from set of invalid blocks 489x_630x", () => {
    const remarks = getRemarksFromBlocks(blocks489x_630x);
    const consolidator = new Consolidator();
    expect(consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("should run consolidation from set of mixed valid and invalid blocks 647x_661x", () => {
    const remarks = getRemarksFromBlocks(blocks647x_661x);
    const consolidator = new Consolidator();
    expect(consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("should run consolidation from set of mixed valid and invalid blocks 630x_647x", () => {
    const remarks = getRemarksFromBlocks(blocks630x_647x);
    const consolidator = new Consolidator();
    expect(consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
