import { validateBase } from "../../src/tools/validate-remark";
import { OP_TYPES } from "../../src/tools/constants";

describe("validation: validateBase", () => {
  it("should be valid 1", () => {
    const remark =
      'RMRK::MINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}';

    expect(validateBase(remark, OP_TYPES.MINT)).toBeUndefined();
  });

  it("should be valid 2", () => {
    const remark = "RMRK::MINT::1.0.0";
    expect(validateBase(remark, OP_TYPES.MINT)).toBeUndefined();
  });

  it("should be valid 3", () => {
    const remark = "RMRK::MINT::1.0.0::FOO::BAR::BAZ";
    expect(validateBase(remark, OP_TYPES.MINT)).toBeUndefined();
  });

  it("should throw - does not start with RMRK", () => {
    const remark =
      'BRB::MINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}';

    expect(() => validateBase(remark, OP_TYPES.MINT)).toThrowError(
      "Invalid remark - does not start with RMRK"
    );
  });

  it("should throw - The op code needs to be MINT, but it is CLINT", () => {
    const remark =
      'RMRK::CLINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}';

    expect(() => validateBase(remark, OP_TYPES.MINT)).toThrowError(
      "The op code needs to be MINT, but it is CLINT"
    );
  });

  it("should throw - wrong version", () => {
    const remark =
      'RMRK::MINT::0.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}';

    expect(() => validateBase(remark, OP_TYPES.MINT)).toThrowError(
      "This remark was issued under version 0.0.0 instead of 1.0.0"
    );
  });
});
