import { validateNFT, validateSend } from "../../../src/rmrk1.0.0/tools/validate-remark";

describe("validation: validateSend", () => {
  it("should be valid send", () => {
    const remark =
      "RMRK::SEND::1.0.0::6802213-24d573f4dfa1d7fd33-KAN-KANS-0000000000000001::dfsfsd dfsfd";

    expect(() => validateSend(remark)).toThrowError(
      "Invalid remark - No whitespaces are allowed in recipient"
    );

    expect(() => validateSend(remark.replace(/\s/g, ""))).not.toThrow();
  });
});
