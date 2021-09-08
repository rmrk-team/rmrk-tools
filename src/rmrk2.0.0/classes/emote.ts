import { validateEmote } from "../tools/validate-remark";
import { VERSION } from "../tools/constants";
import { isValidEmoji } from "../tools/validate-emoji";

export enum EMOTE_NAMESPACES {
  RMRK1 = "RMRK1",
  RMRK2 = "RMRK2",
  PUBKEY = "PUBKEY",
}

const validateNamespace = (namespace: EMOTE_NAMESPACES) => {
  return ["RMRK1", "RMRK2", "PUBKEY"].includes(namespace);
};

export class Emote {
  unicode: string;
  id: string;
  namespace: EMOTE_NAMESPACES;
  static V = VERSION;

  constructor(namespace: EMOTE_NAMESPACES, id: string, unicode: string) {
    this.unicode = unicode;
    this.id = id;
    this.namespace = namespace;
  }

  static fromRemark(remark: string): Emote | string {
    try {
      validateEmote(remark);
      const [
        _prefix,
        _op_type,
        _version,
        namespace,
        id,
        unicode,
      ] = remark.split("::");
      if (!validateNamespace(namespace as EMOTE_NAMESPACES)) {
        throw new Error("Not a valid emote namespace");
      }
      if (!isValidEmoji(unicode)) {
        throw new Error(`Invalid emoji unicode ${unicode}`);
      }
      return new Emote(namespace as EMOTE_NAMESPACES, id, unicode);
    } catch (e: any) {
      console.error(e.message);
      console.log(`EMOTE error: full input was ${remark}`);
      return e.message;
    }
  }
}
