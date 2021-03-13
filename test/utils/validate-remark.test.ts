import test from "ava";
import {
  validateBase,
  validateBuy,
  validateCollection,
  validateNFT,
} from "../../src/tools/validate-remark";
import {
  mintRemarkValidMocks,
  validMintNFTRemarkEvent,
} from "../mocks/remark-mocks";
import { OP_TYPES } from "../../src/tools/constants";

test("validation: validateBase", (t) => {
  t.notThrows(() =>
    validateBase(
      'RMRK::MINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}',
      OP_TYPES.MINT
    )
  );
  t.throws(() =>
    validateBase(
      'BRB::MINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}',
      OP_TYPES.MINT
    )
  );
  t.throws(() =>
    validateBase(
      'RMRK::CLINT::1.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}',
      OP_TYPES.MINT
    )
  );
  t.throws(() =>
    validateBase(
      'RMRK::MINT::0.0.0::{"name"%3A"Foo"%2C"max"%3A5%2C"issuer"%3A"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"%2C"symbol"%3A"FOO"%2C"id"%3A"d43593c715a56da27d-FOO"%2C"metadata"%3A"https%3A%2F%2Fsome.url"}',
      OP_TYPES.MINT
    )
  );
  t.notThrows(() => validateBase("RMRK::MINT::1.0.0", OP_TYPES.MINT));
  t.notThrows(() =>
    validateBase("RMRK::MINT::1.0.0::FOO::BAR::BAZ", OP_TYPES.MINT)
  );
});

test("validation: validateCollection", (t) => {
  t.plan(5);
  mintRemarkValidMocks.forEach((remark) => {
    t.notThrows(() => validateCollection(remark));
  });
});

test("validation: validateNFT", (t) => {
  t.notThrows(() => validateNFT(validMintNFTRemarkEvent));

  t.throws(
    () => {
      validateNFT(
        'RMRK::XXINTNFT::1.0.0::{"collection"%3A"test"%2C"sn"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}'
      );
    },
    { instanceOf: Error }
  );

  const error = t.throws(
    () => {
      validateNFT(
        'RMRK::MINTNFT::1.0.0::{"collection"%3A22%2C"sn"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}'
      );
    },
    { instanceOf: Error }
  );

  t.is(
    error.message,
    "At path: collection -- Expected a string, but received: 22"
  );

  t.throws(
    () => {
      validateNFT(
        'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"sn"%3A111%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}'
      );
    },
    { instanceOf: Error }
  );

  t.throws(
    () => {
      validateNFT(
        'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"sn"%3A"0000000000000001"%2C"transferable"%3A"1"%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}'
      );
    },
    { instanceOf: Error }
  );

  t.throws(
    () => {
      validateNFT(
        'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"foo"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}'
      );
    },
    { instanceOf: Error }
  );

  const metadataError = t.throws(
    () => {
      validateNFT(
        'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"sn"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"hpfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}'
      );
    },
    { instanceOf: Error }
  );

  t.is(
    metadataError.message,
    'At path: metadata -- Expected a string matching `/^(https?|ipfs):\\/\\/.*$/` but received "hpfs://ipfs/QmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"'
  );
});

test("validation: validateBuy", (t) => {
  t.notThrows(() =>
    validateBuy(
      "rmrk::BUY::1.0.0::5105000-0aff6865bed3a66b-VALHELLO-POTION_HEAL-0000000000000001"
    )
  );
});
