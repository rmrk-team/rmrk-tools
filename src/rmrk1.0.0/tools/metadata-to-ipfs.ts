import fs from "fs";
// @ts-ignore
import pinataSDK from "@pinata/sdk";
import { NFTMetadata } from "../classes/nft";

const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);

const defaultOptions = {
  pinataOptions: {
    cidVersion: 1,
  },
};

export const pinToIpfs = async (filePath: string, name?: string) => {
  const options = { ...defaultOptions, pinataMetadata: { name } };
  try {
    const readableStreamForFile = fs.createReadStream(filePath);
    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    return result.IpfsHash;
  } catch (error: any) {
    console.error(error);
  }
};

export const uploadRMRKMetadata = async (
  imagePath: string,
  metadataFields: NFTMetadata
): Promise<string> => {
  const options = {
    ...defaultOptions,
    pinataMetadata: { name: metadataFields.name },
  };
  try {
    const imageHash = await pinToIpfs(imagePath, metadataFields.name);
    const metadata = { ...metadataFields, image: `ipfs://ipfs/${imageHash}` };
    const metadataHashResult = await pinata.pinJSONToIPFS(metadata, options);
    return `ipfs://ipfs/${metadataHashResult.IpfsHash}`;
  } catch (error: any) {
    return "";
  }
};
