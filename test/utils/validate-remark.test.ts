import test from "ava";
import {
  validateBase,
  validateCollection,
} from "../../src/tools/validate-remark";
import { mintRemarkValidMocks } from "../mocks/remark-mocks";

test("validation: validateBase", (t) => {
  t.plan(5);
  mintRemarkValidMocks.forEach((remark) => {
    t.notThrows(() => validateCollection(remark));
  });
});
