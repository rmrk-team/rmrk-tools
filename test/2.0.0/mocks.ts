import { getRemarksFromBlocks, NftClass } from "../../src/rmrk2.0.0";
import { stringToHex } from "@polkadot/util";
import { Remark } from "../../src/rmrk2.0.0/tools/consolidator/remark";
import { Block } from "../../src/rmrk2.0.0/tools/utils";

export const createNftClassMock = (): NftClass =>
  new NftClass(
    0,
    0,
    "D6HSL6nGXHLYWSN8jiL9MSNixH2F2o382KkHsZAtfZvBnxM",
    "KANARIABIRDS",
    "classId",
    "https://some.url"
  );

export const getBlockCallsMock = (): Block[] => [
  {
    block: 0,
    calls: [
      {
        call: "system.remark",
        value: stringToHex(createNftClassMock().create()),
        caller: "D6HSL6nGXHLYWSN8jiL9MSNixH2F2o382KkHsZAtfZvBnxM",
      },
    ],
  },
];

export const getRemarksFromBlocksMock = (): Remark[] =>
  getRemarksFromBlocks(getBlockCallsMock(), ["0x726d726b", "0x524d524b"]);
