import { Consolidator } from "../../src/rmrk2.0.0";
import { getRemarksFromBlocksMock } from "./mocks";

describe("rmrk2.0.0 Consolidator: CREATE NFT CLASS", () => {
  it("should work", async () => {
    const remarks = getRemarksFromBlocksMock();
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
