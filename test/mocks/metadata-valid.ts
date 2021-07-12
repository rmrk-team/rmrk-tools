export const attributesMockBoostNumberValid = [
  {
    display_type: "boost_number",
    trait_type: "mock",
    value: 2,
    max_value: 4,
  },
];

export const attributesMockBoostPercentageValid = [
  {
    display_type: "boost_percentage",
    trait_type: "mock",
    value: 2,
  },
];

export const attributesMockNumberValid = [
  {
    display_type: "number",
    value: 2,
  },
];

export const attributesMockValueValid = [
  {
    value: "2",
  },
];

export const attributesMockDateValid = [
  {
    display_type: "date",
    value: 1620380805485,
  },
];

export const metadataMockAllValid = {
  external_url: "https://youtube.com",
  image: "ipfs://ipfs/12345",
  image_data: "",
  description: "Mock description",
  name: "Mock 1",
  attributes: attributesMockBoostNumberValid,
  background_color: "",
  animation_url: "ipfs://ipfs/12345",
  youtube_url: "https://youtube.com",
};

export const metadataMockAllValid2 = {
  image: "ipfs://ipfs/12345",
  description: "Mock description",
  name: "Mock 1",
  attributes: attributesMockBoostNumberValid,
  background_color: "",
  youtube_url: "https://youtube.com",
};

export const metadataMockAllValid3 = {
  animation_url: "ipfs://ipfs/12345",
};

export const metadataMockAllValid4 = {
  animation_url: "ipfs://ipfs/12345",
  attributes: attributesMockNumberValid,
};

export const metadataMockAllValid5 = {
  animation_url: "ipfs://ipfs/12345",
  attributes: attributesMockBoostPercentageValid,
};

export const metadataMockAllValid6 = {
  animation_url: "ipfs://ipfs/12345",
  attributes: attributesMockValueValid,
};

export const metadataMockAllValid7 = {
  animation_url: "ipfs://ipfs/12345",
  attributes: attributesMockDateValid,
};
