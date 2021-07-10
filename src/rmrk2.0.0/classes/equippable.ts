import { validateEquippable } from "../tools/validate-remark";
import { VERSION } from "../tools/constants";

export const collectionRegexPattern = "^([-+])?(\\S+)$";
const collectionRegex = new RegExp(collectionRegexPattern);

export class Equippable {
  slot: string;
  id: string;
  equippableChange: string;
  static V = VERSION;

  constructor(id: string, slot: string, equippableChange: string) {
    this.slot = slot;
    this.id = id;
    if (!collectionRegex.test(equippableChange)) {
      throw new Error(`Not a valid equippable change ${equippableChange}`);
    }
    this.equippableChange = equippableChange;
  }

  static fromRemark(remark: string): Equippable | string {
    try {
      validateEquippable(remark);
      const [
        _prefix,
        _op_type,
        _version,
        id,
        slot,
        equippableChange,
      ] = remark.split("::");

      if (!collectionRegex.test(equippableChange)) {
        throw new Error(`Not a valid equippable change ${equippableChange}`);
      }

      return new Equippable(id, slot, equippableChange);
    } catch (e) {
      console.error(e.message);
      console.log(`EQUIPPABLE error: full input was ${remark}`);
      return e.message;
    }
  }
}
