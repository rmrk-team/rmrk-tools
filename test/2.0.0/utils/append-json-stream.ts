import fs from "fs";
// @ts-ignore
import JSONStream from "JSONStream";
// @ts-ignore
import ndjson from "ndjson";

export const appendPromise = (appendFilePath: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    try {
      const inputStream = fs.createReadStream(appendFilePath);
      const parseStream = inputStream.pipe(ndjson.parse());

      // const appendFileStream: any[] = [];
      // const readStream = fs.createReadStream(appendFilePath);
      // const parseStream = JSONStream.parse("*");
      // parseStream.on("data", (fileChunk: Record<string, unknown>) => {
      //   if (fileChunk) {
      //     appendFileStream.push(fileChunk);
      //   }
      // });
      //
      // readStream.pipe(parseStream);
      //
      // readStream.on("finish", async () => {
      //   resolve(appendFileStream);
      // });
      //
      // readStream.on("end", async () => {
      //   resolve(appendFileStream);
      // });
      //
      // readStream.on("error", (error) => {
      //   reject(error);
      // });
    } catch (error: any) {
      console.error(error);
      reject(error);
    }
  });
