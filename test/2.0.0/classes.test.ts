import { createNftClassMock } from "./mocks";

describe("rmrk2.0.0 NftClass: Create", () => {
  it("should match snapshot", async () => {
    const nftClass = createNftClassMock();
    expect(await nftClass.create()).toMatchSnapshot();
  });
});
