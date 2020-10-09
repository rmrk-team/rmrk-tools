import program from "commander";

import Logger from "./Logger";
import { fetchRemarks } from "./tools/fetchRemarks";

const helloWorld = () => {
  Logger.info("Hello world!");
};

program.command("start").action(helloWorld);
program
  .command("fetch")
  .option("--ws <ws>", "The websocket URL", "ws://127.0.0.1:9944")
  .option("--from <from>", "The starting block, defaults to 0", "0")
  .option(
    "--prefix <prefix>",
    "Limit remarks to prefix. No default. Can be hex (0x726d726b) or string (rmrk)",
    ""
  )
  .option(
    "--to <to>",
    "Ending block, defaults to latest on given network",
    "latest"
  )
  .action(fetchRemarks);

program.parse(process.argv);
