import { validateBase } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { BaseType } from "../tools/types";
import { Change } from "../changelog";

export class Base {
  readonly block: number;
  readonly symbol: string;
  readonly type: BaseType;
  readonly parts?: IBasePart[];
  issuer: string;
  changes: Change[] = [];

  constructor(
    block: number,
    symbol: string,
    issuer: string,
    type: BaseType,
    parts?: IBasePart[]
  ) {
    this.block = block;
    this.symbol = symbol;
    this.type = type;
    this.issuer = issuer;
    this.parts = parts || undefined;
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
      })
    )}`;
  }

  public change_issuer(address: string): string {
    if (this.block === 0) {
      throw new Error(
        "This base is new, so there's no issuer to change." +
          " If it has been deployed on chain, load the existing " +
          "nft class as a new instance first, then change issuer."
      );
    }
    return `RMRK::CHANGEISSUER::${VERSION}::${this.getId()}::${address}`;
  }

  /**
   *
   * @param classIds - array of collection ids
   */
  public equippable({
    slot,
    classIds,
    operator,
  }: {
    slot: string;
    classIds: string[];
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
    }::${VERSION}::${this.getId()}::${slot}::${operator}${classIds.join(",")}`;
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

  static fromRemark(remark: string, block?: number): Base | string {
    if (!block) {
      block = 0;
    }
    try {
      validateBase(remark);
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this(block, obj.symbol, obj.issuer, obj.type, obj.parts);
    } catch (e) {
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
