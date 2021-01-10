import { Collection } from "../../../src/rmrk1.0.0/classes/collection";
import getKeys from "../devaccs";

function defineSeeds(): any[] {
  const defaultKeys = getKeys();

  const s = [];
  s.push(new Collection(0, "Foo_bar", 5, "", "FOO", "", ""));
  s.push(new Collection(0, "Foo_baz", 10, "", "FOOZ", "", ""));
  return s;
}
