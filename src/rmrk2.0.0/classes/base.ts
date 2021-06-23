import { validateNFT } from "../tools/validate-remark";
import { getRemarkData } from "../tools/utils";
import { OP_TYPES, PREFIX, VERSION } from "../tools/constants";
import { BaseType } from "../tools/types";

export class BASE {
  readonly block: number;
  readonly name: string;
  readonly id: string;
  readonly type: BaseType;
  owner: string;
  parts: Record<string, IBasePart> | null;

  constructor(
    block: number,
    name: string,
    id: string,
    type: BaseType,
    parts?: Record<string, IBasePart>
  ) {
    this.block = block;
    this.name = name;
    this.id = id;
    this.type = type;
    this.owner = "";
    this.parts = parts || null;
  }

  public mint(): string {
    if (this.block) {
      throw new Error("An already existing BASE cannot be minted!");
    }
    return `${PREFIX}::${OP_TYPES.BASE}::${VERSION}::${encodeURIComponent(
      JSON.stringify({
        name: this.name,
        id: this.id,
        type: this.type,
        parts: this.parts,
      })
    )}`;
  }

  static fromRemark(remark: string, block?: number): BASE | string {
    if (!block) {
      block = 0;
    }
    try {
      validateNFT(remark);
      const [prefix, op_type, version, dataString] = remark.split("::");
      const obj = getRemarkData(dataString);
      return new this(block, obj.name, obj.id, obj.type, obj.parts);
    } catch (e) {
      console.error(e.message);
      console.log(`BASE error: full input was ${remark}`);
      return e.message;
    }
  }
}

export interface IBasePart {
  type: "slot" | "fixed";
  equippable: string[] | "*";
  unequip?: "unequip" | "burn";
  z?: number;
  src?: string;
}
