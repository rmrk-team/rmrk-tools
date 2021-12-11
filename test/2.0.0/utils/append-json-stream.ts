import fs from "fs";
// @ts-ignore
import JSONStream from "JSONStream";

export const appendPromise = (appendFilePath: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    try {
      let appendFileStream: any[] = [];
      const readStream = fs.createReadStream(appendFilePath);
      const parseStream = JSONStream.parse();
      parseStream.on("data", (fileContent: any[]) => {
        if (fileContent && fileContent.length) {
          appendFileStream = appendFileStream.concat(fileContent);
        }
      });

      readStream.pipe(parseStream);

      readStream.on("finish", async () => {
        resolve(appendFileStream);
      });

      readStream.on("end", async () => {
        resolve(appendFileStream);
      });

      readStream.on("error", (error) => {
        reject(error);
      });
    } catch (error: any) {
      console.error(error);
      reject(error);
    }
  });
