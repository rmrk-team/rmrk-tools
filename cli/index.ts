#! /usr/bin/env node
import program from "commander";
import * as fetch from "./fetch";
import * as consolidate from "./consolidate";
import * as seed from "./seed";
import * as getevents from "./getevents";
import * as validate from "./validate";

fetch.addTo(program);
consolidate.addTo(program);
seed.addTo(program);
getevents.addTo(program);
validate.addTo(program);

program.parse(process.argv);
