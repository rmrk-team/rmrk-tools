import { Consolidator } from "../src";
import { getRemarksFromBlocks } from "../src/tools/utils";
import {
  blockCollectionMintedTwice,
  blockNFTMintedTwice,
  syntheticChangeIssuerBlock,
  syntheticChangeIssuerBlockInvalid,
  syntheticChangeIssuerBlockInvalidCaller,
  validBlocks,
} from "./mocks/blocks";
import { blocks647x_661x, blocksDumpAll } from "./mocks/blocks-dump";

describe("tools: Consolidator", () => {
  it("should run consolidation from set of mixed valid and invalid blocks 647x_661x", async () => {
    const remarks = getRemarksFromBlocks(blocks647x_661x, [
      "0x726d726b",
      "0x524d524b",
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("should run consolidation from entire dump", async () => {
    const remarks = getRemarksFromBlocks(blocksDumpAll, [
      "0x726d726b",
      "0x524d524b",
    ]);
    const consolidator = new Consolidator();
    expect(await consolidator.consolidate(remarks)).toMatchSnapshot();
  });

  it("should run consolidation from dump with emote changes", async () => {
    const remarks = getRemarksFromBlocks(blocksDumpAll, [
      "0x726d726b",
      "0x524d524b",
    ]);
    const consolidator = new Consolidator(undefined, undefined, true);
    const consolidated = await consolidator.consolidate(remarks);
    const withEmotes = Object.values(consolidated.nfts).filter((nft) =>
      nft.changes.some((c) => c.field === "reactions")
    );
    expect(withEmotes).toMatchSnapshot();
  });

  it("should be invalid: Collection token is minted twice with same ID", async () => {
    const consolidator = new Consolidator();
    expect(
      (
        await consolidator.consolidate(
          getRemarksFromBlocks(blockCollectionMintedTwice, [
            "0x726d726b",
            "0x524d524b",
          ])
        )
      ).invalid[0].message
    ).toBe("[MINT] Attempt to mint already existing collection");
  });

  it("should be invalid: NFT token is minted twice with same ID", async () => {
    const consolidator = new Consolidator();
    expect(
      (
        await consolidator.consolidate(
          getRemarksFromBlocks(blockNFTMintedTwice, [
            "0x726d726b",
            "0x524d524b",
          ])
        )
      ).invalid[0].message
    ).toBe("[MINTNFT] Attempt to mint already existing NFT");
  });

  it("should run valid CHANGEISSUER", async () => {
    const remarks = getRemarksFromBlocks(
      [...validBlocks, syntheticChangeIssuerBlock],
      ["0x726d726b", "0x524d524b"]
    );

    const consolidator = new Consolidator();
    expect((await consolidator.consolidate(remarks)).invalid.length).toBe(0);
  });

  it("should run CHANGEISSUER with invalid remark (wrong order issuer and id)", async () => {
    const remarks = getRemarksFromBlocks(
      [...validBlocks, syntheticChangeIssuerBlockInvalid],
      ["0x726d726b", "0x524d524b"]
    );

    const consolidator = new Consolidator();
    expect((await consolidator.consolidate(remarks)).invalid[0].message).toBe(
      "This CHANGEISSUER remark is invalid - no such collection with ID EY8n3D72AXj9EYyB5Nhxi9phvV8TtJAovySkUiNCZMoQ1VG found before block 9999999!"
    );
  });

  it("should run CHANGEISSUER with invalid caller", async () => {
    const remarks = getRemarksFromBlocks(
      [...validBlocks, syntheticChangeIssuerBlockInvalidCaller],
      ["0x726d726b", "0x524d524b"]
    );

    const consolidator = new Consolidator();
    expect((await consolidator.consolidate(remarks)).invalid[0].message).toBe(
      "Attempting to change issuer of collection 705BED5A790A0D0072-BICHITOS when not issuer!"
    );
  });

  it("should run consolidation from dump with interaction changes", async () => {
    const remarks = getRemarksFromBlocks(blocksDumpAll, [
      "0x726d726b",
      "0x524d524b",
    ]);
    const consolidator = new Consolidator(undefined, undefined, false, true);
    const consolidated = await consolidator.consolidate(remarks);
    const last50Changes = consolidated.changes!.slice(
      consolidated.changes!.length - 50
    );
    expect(last50Changes).toMatchSnapshot();
  });
});
