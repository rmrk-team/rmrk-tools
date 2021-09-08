export const attributesMockBoostNumberValid = {
  test: {
    type: "string",
    value: "mock",
  },
};

export const attributesMockNumberValid = {
  test: {
    type: "int",
    value: 2,
  },
};

export const attributesMockFloatValid = {
  test: {
    type: "float",
    value: 2.2,
  },
};

export const attributesMockValueValid = {
  test: {
    type: "string",
    value: "2",
  },
};

export const metadataMockAllValid = {
  external_url: "https://youtube.com",
  image: "ipfs://ipfs/12345",
  image_data: "",
  description: "Mock description",
  name: "Mock 1",
  properties: attributesMockBoostNumberValid,
  background_color: "",
  animation_url: "ipfs://ipfs/12345",
  youtube_url: "https://youtube.com",
};

export const metadataMockAllValid2 = {
  image: "ipfs://ipfs/12345",
  description: "Mock description",
  name: "Mock 1",
  properties: attributesMockBoostNumberValid,
  background_color: "",
  youtube_url: "https://youtube.com",
};

export const metadataMockAllValid3 = {
  animation_url: "ipfs://ipfs/12345",
};

export const metadataMockAllValid4 = {
  animation_url: "ipfs://ipfs/12345",
  properties: attributesMockNumberValid,
};

export const metadataMockAllValid6 = {
  animation_url: "ipfs://ipfs/12345",
  properties: attributesMockValueValid,
};
