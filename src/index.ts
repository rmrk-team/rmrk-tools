import program from "commander";
import * as fetch from "./cli-commands/fetch";
import * as consolidate from "./cli-commands/consolidate";
import * as seed from "./cli-commands/seed";
import * as getevents from "./cli-commands/getevents";
import * as validate from "./cli-commands/validate";

fetch.addTo(program);
consolidate.addTo(program);
seed.addTo(program);
getevents.addTo(program);
validate.addTo(program);

program.parse(process.argv);
