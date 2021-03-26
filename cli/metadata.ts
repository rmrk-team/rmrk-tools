#! /usr/bin/env node
import { uploadRMRKMetadata } from "../src/tools/metadata-to-ipfs";
import arg from "arg";
import fs from "fs";
import { NFTMetadata } from "../src/rmrk1.0.0/classes/nft";

const fsPromises = fs.promises;

interface MetadataSeedItem {
  metadataFields: NFTMetadata;
  imagePath?: string;
}

const metadata = async () => {
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

  const promises = (metadataInput.metadata as MetadataSeedItem[]).map(
    async (metadata, index) => {
      if (!metadata.imagePath) {
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

metadata();
