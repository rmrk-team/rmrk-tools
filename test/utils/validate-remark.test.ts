import test from "ava";
import {
  validateBase,
  validateCollection,
} from "../../src/tools/validate-remark";
import { mintRemarkValidMocks } from "../mocks/remark-mocks";

test("validation: validateBase", (t) => {
  t.plan(5);
  t.notThrows(() =>
    validateCollection(
      'RMRK::MINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}'
    )
  );
  t.throws(() =>
    validateCollection(
      'BRB::MINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}'
    )
  );
  t.throws(() =>
    validateCollection(
      'RMRK::CLINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}'
    )
  );
  t.throws(() =>
    validateCollection(
      'RMRK::MINT::0.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}'
    )
  );
  t.throws(() => validateCollection("RMRK::MINT::1.0.0"));
});

test("validation: validateCollection", (t) => {
  t.plan(5);
  mintRemarkValidMocks.forEach((remark) => {
    t.notThrows(() => validateCollection(remark));
  });
});
