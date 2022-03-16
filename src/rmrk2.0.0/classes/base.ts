import { validateBase } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { BaseType } from "../tools/types";
import { Change } from "../changelog";
import { encodeAddress } from "@polkadot/keyring";

export class Base {
  readonly block: number;
  readonly symbol: string;
  readonly type?: BaseType;
  readonly parts?: IBasePart[];
  readonly metadata?: string;
  issuer: string;
  changes: Change[] = [];
  themes?: Record<string, Theme>;

  constructor(
    block: number,
    symbol: string,
    issuer: string,
    type?: BaseType,
    parts?: IBasePart[],
    themes?: Record<string, Theme>,
    metadata?: string
  ) {
    this.block = block;
    this.symbol = symbol;
    this.type = type || undefined;
    this.issuer = issuer;
    this.parts = parts || undefined;
    this.themes = themes || undefined;
    this.metadata = metadata;
  }

  public base(): string {
    if (this.block) {
      throw new Error("An already existing BASE cannot be minted!");
    }
    return `${PREFIX}::${OP_TYPES.BASE}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        symbol: this.symbol,
        type: this.type,
        issuer: this.issuer,
        parts: this.parts,
        themes: this.themes,
        metadata: this.metadata,
      })
    )}`;
  }

  public change_issuer(address: string): string {
    if (this.block === 0) {
      throw new Error(
        "This base is new, so there's no issuer to change." +
          " If it has been deployed on chain, load the existing " +
          "collection as a new instance first, then change issuer."
      );
    }
    return `${PREFIX}::${
      OP_TYPES.CHANGEISSUER
    }::${VERSION}::${this.getId()}::${address}`;
  }

  /**
   *
   * @param slot slot id
   * @param collections array of collection ids
   * @param operator whether to add, remove or replace collectionId
   */
  public equippable({
    slot,
    collections,
    operator,
  }: {
    slot: string;
    collections: string[];
    operator: "+" | "-" | "";
  }): string {
    if (!this.block) {
      throw new Error(
        "You can only change equippables on an existing Base. If you just created this, please load a new, separate instance as the block number is an important part of an Base's ID."
      );
    }
    if (!slot) {
      throw new Error("You cannot change equippable without specifying slot");
    }
    return `${PREFIX}::${
      OP_TYPES.EQUIPPABLE
    }::${VERSION}::${this.getId()}::${slot}::${operator}${collections.join(
      ","
    )}`;
  }

  /**
   *
   * @param themeId theme id
   * @param theme Theme object
   */
  public themeadd({
    themeId,
    theme,
  }: {
    themeId: string;
    theme: Theme;
  }): string {
    if (!this.block) {
      throw new Error(
        "You can only add theme on an existing Base. If you just created this, please load a new, separate instance as the block number is an important part of an Base's ID."
      );
    }
    if (!themeId) {
      throw new Error("You cannot add theme without specifying it's id");
    }

    if (this.themes?.[themeId]) {
      throw new Error("There is already a theme with this id");
    }
    return `${PREFIX}::${
      OP_TYPES.THEMEADD
    }::${VERSION}::${this.getId()}::${themeId}::${encodeURIComponent(
      JSON.stringify(theme)
    )}`;
  }

  public getId(): string {
    if (!this.block)
      throw new Error("This base is not minted, so it cannot have an ID.");
    return `base-${this.block}-${this.symbol}`;
  }

  public addChange(c: Change): Base {
    this.changes.push(c);
    return this;
  }

  public getChanges(): Change[] {
    return this.changes;
  }

  static fromRemark(
    remark: string,
    block?: number,
    ss58Format?: number
  ): Base | string {
    if (!block) {
      block = 0;
    }
    try {
      validateBase(remark);
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this(
        block,
        obj.symbol,
        encodeAddress(obj.issuer, ss58Format),
        obj.type,
        obj.parts,
        obj.themes,
        obj.metadata
      );
    } catch (e: any) {
      console.error(e.message);
      console.log(`BASE error: full input was ${remark}`);
      return e.message;
    }
  }
}

export interface IBasePart {
  id: string;
  type: "slot" | "fixed";
  equippable?: string[] | "*";
  unequip?: "unequip" | "burn";
  z?: number;
  src?: string;
}

export type Theme = Record<string, string | boolean>;
