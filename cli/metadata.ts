#! /usr/bin/env node
import "@polkadot/api-augment";
import { uploadRMRKMetadata } from "../src/rmrk2.0.0/tools/metadata-to-ipfs";
import arg from "arg";
import fs from "fs";
import { NFTMetadata } from "../src/rmrk2.0.0/classes/nft";

const fsPromises = fs.promises;

interface MetadataSeedItem {
  metadataFields: NFTMetadata;
  imagePath?: string;
}

const validateMetadataSeedFields = (metadataSeed: MetadataSeedItem[]) => {
  metadataSeed.forEach((metadata) => {
    const {
      name,
      external_url,
      description,
    } = metadata.metadataFields;
    if (!name || !external_url || !description) {
      throw new Error(
        "provided metadata has 1 or more fields missing (!name || !external_url || !description)"
      );
    }
  });
};

const validateMetadataSeedImages = async (metadataSeed: MetadataSeedItem[]) => {
  const promises = metadataSeed.map(async (metadataSeedItem) => {
    const error = new Error(
      `Cannot read Image from path: ${metadataSeedItem.imagePath}`
    );
    try {
      if (!metadataSeedItem.imagePath) {
        throw error;
      }
      const imageFile = await fsPromises.readFile(
        `${process.cwd()}${metadataSeedItem.imagePath}`
      );
      if (!imageFile) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  });

  return await Promise.all(promises);
};

const uploadMetadata = async () => {
  const args = arg({
    "--input": String, // metadata input file
    "--output": String, // metadata output file
  });

  const inputFile = await fsPromises.readFile(
    args["--input"] || "./metadata-seed.example.json"
  );
  const metadataInput = JSON.parse(inputFile.toString());

  if (!metadataInput?.metadata || !Array.isArray(metadataInput?.metadata)) {
    throw new Error("Metadata json file missing 'metadata' array");
  }

  // Validate seed JSON before trying to upload and pin it
  validateMetadataSeedFields(metadataInput.metadata);
  await validateMetadataSeedImages(metadataInput.metadata);

  const promises = (metadataInput.metadata as MetadataSeedItem[]).map(
    async (metadata, index) => {
      if (!metadata.imagePath && metadata.metadataFields?.image) {
        // This item already has valid image
        return metadata.metadataFields;
      }
      const metadataItem = await uploadRMRKMetadata(
        `${process.cwd()}${metadata.imagePath}`,
        metadata.metadataFields
      );
      return {
        [metadata.metadataFields.name ||
        metadata.imagePath ||
        index]: metadataItem,
      };
    }
  );

  const metadataOutput = await Promise.all(promises);

  fs.writeFileSync(
    args["--output"] || "./metadata-output.json",
    JSON.stringify(metadataOutput)
  );
  process.exit(0);
};

uploadMetadata();
