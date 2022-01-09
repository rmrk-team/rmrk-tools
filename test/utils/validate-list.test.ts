import { validateList } from "../../src/tools/validate-remark";

describe("validation: validateList", () => {
  it("should be valid list", () => {
    const remark =
      "RMRK::LIST::1.0.0::10865860-b2379dab465991a730-TEST::1234-TEST-0000000000000001::980000000000";

    expect(() => validateList(remark)).not.toThrow();
  });
});
