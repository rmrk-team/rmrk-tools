import { validateBuy } from "../../../src/rmrk1.0.0/tools/validate-remark";

describe("validation: validateBuy", () => {
  it("should be valid buy 1", () => {
    const remark =
      "rmrk::BUY::1.0.0::5105000-0aff6865bed3a66b-VALHELLO-POTION_HEAL-0000000000000001";

    expect(() => validateBuy(remark)).not.toThrow();
  });
});
