import { validateMetadata } from "../../../src/rmrk2.0.0/tools/validate-metadata";
import {
  attributesMockBoostNumberValid,
  metadataMockAllValid,
  metadataMockAllValid2,
  metadataMockAllValid4,
  metadataMockAllValid6,
} from "../mocks/metadata-valid";
import {Metadata} from "../../../src/rmrk2.0.0";

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
      validateMetadata(metadataMockAllValid as Metadata)
    ).not.toThrow();
  });

  it("should be valid2", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid2 as Metadata)
    ).not.toThrow();
  });

  it("should be valid4", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid4 as Metadata)
    ).not.toThrow();
  });

  it("should be valid6", () => {
    expect(() =>
      validateMetadata(metadataMockAllValid6 as Metadata)
    ).not.toThrow();
  });
});

describe("validation: validateMetadata with invalid mocks", () => {
  it("should be invalid", () => {
    expect(() =>
      validateMetadata({
        mediaUri: "file://dfsdf",
      } as Metadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        name: 1,
      } as Metadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        description: 1,
      } as Metadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: 1,
      } as Metadata)
    ).toThrow();

    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        externalUri: "Mock",
      } as Metadata)
    ).toThrow();
  });

  it("should be invalid with invalid attributes passed", () => {
    expect(() =>
      validateMetadata({
        image: "ipfs://dfsdf",
        properties: { test: { value: 123, type: "string" } },
      } as Metadata)
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
      } as Metadata)
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
      } as Metadata)
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
      } as Metadata)
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
      } as Metadata)
    ).toThrow();
  });
});
