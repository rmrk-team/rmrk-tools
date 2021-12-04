import { validateMetadata } from "../../../src/rmrk2.0.0/tools/validate-metadata";
import { NFTMetadata } from "../../../src/rmrk2.0.0/classes/nft";
import {
  attributesMockBoostNumberValid,
  metadataMockAllValid,
  metadataMockAllValid2,
  metadataMockAllValid4,
  metadataMockAllValid6,
} from "../mocks/metadata-valid";

export const attributesMockDateInvalid = [
  {
    display_type: "date",
    value: 1620380805485,
  },
];

export const metadataMockAllInvalid = {
  external_url: "https://youtube.com",
  image: "file://",
  image_data: "",
  description: "Mock description",
  name: "Mock 1",
  properties: attributesMockBoostNumberValid,
};

describe("validation: validateMetadata with valid mocks", () => {
  it("should be valid", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid2", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid2 as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid4", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid4 as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid6", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid6 as NFTMetadata)
    ).not.toThrow();
  });
});

describe("validation: validateMetadata with invalid mocks", () => {
  it("should be invalid", () => {
    expect(() =>
      validateMetadata({
        image: "file://dfsdf",
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        name: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        description: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        background_color: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        name: "Mock",
      } as NFTMetadata)
    ).toThrow();
    
    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        external_url: "Mock",
      } as NFTMetadata)
    ).toThrow();
  });

  it("should be invalid with invalid attributes passed", () => {
    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        properties: { test: { value: 123, type: "string" } },
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        properties: {
          test: {
            type: "int",
            value: "123",
          },
        },
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        properties: {
          test: {
            type: "string",
            value: 123,
          },
        },
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        properties: {
          test: {
            type: "int",
            value: 123,
          },
        },
      } as NFTMetadata)
    ).toBeTruthy();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        properties: {
          test: {
            type: "float",
            value: "123",
          },
        },
      } as NFTMetadata)
    ).toThrow();
  });
});
