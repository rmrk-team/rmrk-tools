import { validateCollection } from "../../src/tools/validate-remark";
import { mintRemarkValidMocks } from "../mocks/remark-mocks";

describe("validation: validateCollection", () => {
  mintRemarkValidMocks.forEach((remark) => {
    it("should be valid", () => {
      expect(validateCollection(remark)).toBeUndefined();
    });
  });
});
