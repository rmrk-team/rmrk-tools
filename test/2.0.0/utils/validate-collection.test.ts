import { validateCollection } from "../../../src/rmrk2.0.0/tools/validate-remark";
import { mintRemarkValidMocks } from "../mocks/remark-mocks";

describe("validation: validateCollection", () => {
  mintRemarkValidMocks.forEach((remark) => {
    it("should be valid", () => {
      expect(() => validateCollection(remark)).not.toThrow();
    });
  });
});
