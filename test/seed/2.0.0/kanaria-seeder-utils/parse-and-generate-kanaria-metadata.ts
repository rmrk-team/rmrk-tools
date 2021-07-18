import fs from "fs";
import { NFTMetadata } from "../../../../src/rmrk2.0.0/classes/nft";
import { Attribute } from "../../../../src/rmrk2.0.0/tools/types";
// @ts-ignore
import pinataSDK from "@pinata/sdk";

const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);
const defaultOptions = {
  pinataOptions: {
    cidVersion: 1,
  },
};
const fsPromises = fs.promises;

export const pinCollectionsMetadatas = async () => {
  const metadataRaw = await fsPromises.readFile(
    `${process.cwd()}/test/seed/2.0.0/data/kanaria-tradable-collections-metadata.json`
  );
  if (!metadataRaw) {
    throw new Error("No metadata file");
  }
  const metadataRawJson = JSON.parse(metadataRaw.toString());

  const promises = metadataRawJson.map(async (metadata: { name: any }) => {
    const options = {
      ...defaultOptions,
      pinataMetadata: { name: metadata.name },
    };
    try {
      const metadataHashResult = await pinata.pinJSONToIPFS(metadata, options);
      return `ipfs://ipfs/${metadataHashResult.IpfsHash}`;
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  });

  const result = await Promise.all(promises);

  fs.writeFileSync(`collection-metadatas.json`, JSON.stringify(result));
};
export const uploadRMRKMetadata = async (
  metadataFields: NFTMetadata
): Promise<string> => {
  const options = {
    ...defaultOptions,
    pinataMetadata: { name: metadataFields.name },
  };
  try {
    const metadata = { ...metadataFields };
    const metadataHashResult = await pinata.pinJSONToIPFS(metadata, options);
    return `ipfs://ipfs/${metadataHashResult.IpfsHash}`;
  } catch (error) {
    return "";
  }
};

interface MetadataRaw {
  item: string;
  emote: string;
  Rarity: string;
  type: string;
  path: string;
  shortName: string;
  fullName: string;
  Name: string;
  Description: string;
  "Attribute: context": "";
  "Attribute: type": "";
  Collection: "";
  Minted: "";
  Amount: "";
  Ready: "" | "Y";
}

export const generateKanariaMetadata = async () => {
  try {
    const metadataRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/metadata.json`
    );
    if (!metadataRaw) {
      throw new Error("No metadata file");
    }
    const metadataRawJson: MetadataRaw[] = JSON.parse(metadataRaw.toString());
    const metadataRawJsonReady = metadataRawJson.filter(
      (metadata) => metadata.Ready === "Y"
    );

    const pinnedRaw = await fsPromises.readFile(
      `${process.cwd()}/pinned-items-metadatas.json`
    );
    const pinnedRawJson = JSON.parse(pinnedRaw.toString());

    const emotesBreakdownRaw = await fsPromises.readFile(
      `${process.cwd()}/test/seed/2.0.0/data/emote-resources.json`
    );

    // console.log(files);

    let matadata = metadataRawJsonReady.map((metadataRawItem) => {
      const attributes: Attribute[] = [];
      Object.keys(metadataRawItem).forEach((key) => {
        if (key.includes("Attribute:")) {
          const attributeKey = key.slice("Attribute: ".length);
          const attributeValue =
            metadataRawItem[key as keyof typeof metadataRawItem];
          attributes.push({
            trait_type: attributeKey,
            value: attributeValue,
          });
        }
      });

      return {
        id: `${metadataRawItem.item.replace(".svg", "")}`,
        slot: metadataRawItem.type,
        metadata: {
          image: `ipfs://ipfs/QmZX9GT5aaMgaL7b4dmMM4cfuZnaM3gQU4g8DutT47bPrY/${
            metadataRawItem.emote
          }/${metadataRawItem.item.replace(".svg", "_thumb.svg")}`,
          description: metadataRawItem.Description,
          name: metadataRawItem.Name,
          attributes,
        },
      };
    });

    // Filter out what is already pinned
    matadata = matadata.filter((mtd) => pinnedRawJson.findIndex(mtd?.id) < 0);

    const promises = matadata.map(async (metadataItem) => {
      const options = {
        ...defaultOptions,
        pinataMetadata: { name: metadataItem.id },
      };
      try {
        const metadata = { ...metadataItem.metadata };
        const metadataHashResult = await pinata.pinJSONToIPFS(
          metadata,
          options
        );
        return {
          ...metadataItem,
          metadata: `ipfs://ipfs/${metadataHashResult.IpfsHash}`,
        };
      } catch (error) {
        console.log(error);
        console.log(JSON.stringify(error));
        return "";
      }
    });

    const pinnedMetadata = await Promise.all(promises);
    console.log(pinnedMetadata);

    fs.writeFileSync(
      `${process.cwd()}/test/seed/2.0.0/data/pinned-items-metadatas.json`,
      JSON.stringify(pinnedMetadata.filter((mtdta) => mtdta !== ""))
    );
  } catch (error) {
    console.log(error);
  }
};
