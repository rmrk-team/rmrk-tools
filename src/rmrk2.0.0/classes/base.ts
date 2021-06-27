import { validateNFT } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { BaseType } from "../tools/types";

export class Base {
  readonly block: number;
  readonly id: string;
  readonly type: BaseType;
  issuer: string;
  parts?: IBasePart[];

  constructor(
    block: number,
    id: string,
    issuer: string,
    type: BaseType,
    parts?: IBasePart[]
  ) {
    this.block = block;
    this.id = id;
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
        id: this.id,
        type: this.type,
        issuer: this.issuer,
        parts: this.parts,
      })
    )}`;
  }

  static generateId(id: string, block: string): string {
    if (!id || !block) {
      throw new Error("Need id and block to generate BASE id");
    }
    return `base-${block}-${id}`;
  }

  static fromRemark(remark: string, block?: number): Base | string {
    if (!block) {
      block = 0;
    }
    try {
      validateNFT(remark);
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this(block, obj.id, obj.issuer, obj.type, obj.parts);
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
  equippable: string[] | "*";
  unequip?: "unequip" | "burn";
  z?: number;
  src?: string;
}
