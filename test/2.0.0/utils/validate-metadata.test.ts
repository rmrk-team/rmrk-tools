import { validateMetadata } from "../../../src/rmrk2.0.0/tools/validate-metadata";
import { NFTMetadata } from "../../../src/rmrk2.0.0/classes/nft";
import {
  attributesMockBoostNumberValid,
  metadataMockAllValid,
  metadataMockAllValid2,
  metadataMockAllValid3,
  metadataMockAllValid4,
  metadataMockAllValid5,
  metadataMockAllValid6,
  metadataMockAllValid7,
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
  attributes: attributesMockBoostNumberValid,
  background_color: "",
  animation_url: "ipfs://ipfs/12345",
  youtube_url: "https://youtube.com",
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

  it("should be valid3", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid3 as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid4", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid4 as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid5", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid5 as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid6", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid6 as NFTMetadata)
    ).not.toThrow();
  });

  it("should be valid7", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid7 as NFTMetadata)
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
        animation_url: "file://dfsdf",
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        animation_url: "ipfs://dfsdf",
        name: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        animation_url: "ipfs://dfsdf",
        description: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        animation_url: "ipfs://dfsdf",
        background_color: 1,
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        animation_url: "ipfs://dfsdf",
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
        youtube_url: "Mock",
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
        attributes: [{ value: 123 }],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            display_type: "boost_number",
            value: "123",
          },
        ],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            display_type: "boost_percentage",
            value: "123",
          },
        ],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            display_type: "number",
            value: "123",
          },
        ],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            display_type: "date",
            value: "123",
          },
        ],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            display_type: "date",
            value: 123,
          },
        ],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            max_value: 122,
            display_type: "number",
            value: 123,
          },
        ],
      } as NFTMetadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        attributes: [
          {
            display_type: "number",
            value: "123",
          },
        ],
      } as NFTMetadata)
    ).toThrow();
  });
});
