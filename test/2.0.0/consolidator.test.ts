import { Consolidator, getRemarksFromBlocks } from "../../src/rmrk2.0.0";
import { NftClass } from "../../src/rmrk2.0.0";
import { stringToHex } from "@polkadot/util";

describe("rmrk2.0.0 Consolidator: CREATE NFT CLASS", () => {
  it("should work", async () => {
    const collection = new NftClass(
      0,
      0,
      "D6HSL6nGXHLYWSN8jiL9MSNixH2F2o382KkHsZAtfZvBnxM",
      "KANARIABIRDS",
      "classId",
      "https://some.url"
    );
    const blockCalls = [
      {
        block: 0,
        calls: [
          {
            call: "system.remark",
            value: stringToHex(collection.create()),
            caller: "D6HSL6nGXHLYWSN8jiL9MSNixH2F2o382KkHsZAtfZvBnxM",
          },
        ],
      },
    ];
    const remarks = getRemarksFromBlocks(blockCalls, [
      "0x726d726b",
      "0x524d524b",
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });
});
