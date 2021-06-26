import { validateNFT } from "../../../src/rmrk1.0.0/tools/validate-remark";
import { validMintNFTRemarkEvent } from "../mocks/remark-mocks";

describe("validation: validateNFT", () => {
  it("should be valid NFT 1", () => {
    expect(() => validateNFT(validMintNFTRemarkEvent)).not.toThrow();
  });

  it("should throw - invalid op code", () => {
    const remark =
      'RMRK::XXINTNFT::1.0.0::{"collection"%3A"test"%2C"sn"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}';

    expect(() => validateNFT(remark)).toThrowError(
      "The op code needs to be MINTNFT, but it is XXINTNFT"
    );
  });

  it("should throw - invalid collection", () => {
    const remark =
      'RMRK::MINTNFT::1.0.0::{"collection"%3A22%2C"sn"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}';

    expect(() => validateNFT(remark)).toThrowError(
      "At path: collection -- Expected a string, but received: 22"
    );
  });

  it("should throw - invalid sn", () => {
    const remark =
      'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"sn"%3A111%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}';

    expect(() => validateNFT(remark)).toThrowError(
      "At path: sn -- Expected a string, but received: 111"
    );
  });

  it("should throw - invalid transferable", () => {
    const remark =
      'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"sn"%3A"0000000000000001"%2C"transferable"%3A"1"%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}';

    expect(() => validateNFT(remark)).toThrowError(
      'At path: transferable -- Expected a number, but received: "1"'
    );
  });

  it("should throw - invalid sn type", () => {
    const remark =
      'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"foo"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"ipfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}';

    expect(() => validateNFT(remark)).toThrowError(
      "At path: sn -- Expected a string, but received: undefined"
    );
  });

  it("should throw - invalid metadata string", () => {
    const remark =
      'RMRK::MINTNFT::1.0.0::{"collection"%3A"category"%2C"sn"%3A"0000000000000001"%2C"transferable"%3A1%2C"name"%3A"VIP Invitation %231"%2C"metadata"%3A"hpfs%3A%2F%2Fipfs%2FQmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"%2C"currentOwner"%3A"HPSgWwpjnMe9oyBq4t2dA3dRTU8PwDAU32q6E76xjFDDrEX"%2C"instance"%3A"VIP_INVITATION_1"}';

    expect(() => validateNFT(remark)).toThrowError(
      'At path: metadata -- Expected a string matching `/^(https?|ipfs):\\/\\/.*$/` but received "hpfs://ipfs/QmQ2Q57PVpaP8QvWvvH9kfn1CdCY49pcv1AaLBjDwS2p4g"'
    );
  });
});
