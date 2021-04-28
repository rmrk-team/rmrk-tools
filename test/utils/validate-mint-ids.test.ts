import { Collection, validateMintIds } from "../../src";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/keyring";

const remarkMock = {
  block: 6707036,
  caller: "FqCJeGcPidYSsvvmT17fHVaYdE2nXMYgPsBn3CP9gugvZR5",
  extra_ex: undefined,
  interaction_type: "MINT",
  remark: `RMRK::MINT::1.0.0::{\\"id\\"%3A\\"900D19DC7D3C444E4C-CNR\\"%2C\\"_id\\"%3A\\"\\"%2C\\"symbol\\"%3A\\"CNR\\"%2C\\"issuer\\"%3A\\"FqCJeGcPidYSsvvmT17fHVaYdE2nXMYgPsBn3CP9gugvZR5\\"%2C\\"version\\"%3A\\"1.0.0\\"%2C\\"name\\"%3A\\"CANARY\\"%2C\\"max\\"%3A1%2C\\"metadata\\"%3A\\"ipfs%3A%2F%2Fipfs%2FQmQJGDSd6rxUZuTFDKaCKzVz6nvQpZ7yVLDLnz2dwvvjZs\\"}`,
  version: "1.0.0",
};

const collextion = new Collection(
  0,
  "test",
  0,
  "FqCJeGcPidYSsvvmT17fHVaYdE2nXMYgPsBn3CP9gugvZR5",
  "CNR",
  Collection.generateId(u8aToHex(decodeAddress(remarkMock.caller)), "CNR"),
  "http://test"
);

describe("validation: validateMintIds", () => {
  it("should correctly validate collection id", () => {
    expect(() => validateMintIds(collextion, remarkMock)).not.toThrow();
  });
});
