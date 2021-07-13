import { validateEmote } from "../tools/validate-remark";
import { VERSION } from "../tools/constants";
import { isValidEmoji } from "../tools/validate-emoji";

type TEmoteNamespace = "rmrk1" | "rmrk2" | "pubkey";

const validateNamespace = (namespace: TEmoteNamespace) => {
  return ["rmrk1", "rmrk2", "pubkey"].includes(namespace);
};

export class Emote {
  unicode: string;
  id: string;
  namespace: TEmoteNamespace;
  static V = VERSION;

  constructor(namespace: TEmoteNamespace, id: string, unicode: string) {
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
      if (!validateNamespace(namespace as TEmoteNamespace)) {
        throw new Error("Not a valid emote namespace");
      }
      if (!isValidEmoji(unicode)) {
        throw new Error(`Invalid emoji unicode ${unicode}`);
      }
      return new Emote(namespace as TEmoteNamespace, id, unicode);
    } catch (e) {
      console.error(e.message);
      console.log(`EMOTE error: full input was ${remark}`);
      return e.message;
    }
  }
}
