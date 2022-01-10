import { validateEmote } from "../../tools/validate-remark";

export class Emote {
  unicode: string;
  id: string;
  static V = "1.0.0";

  constructor(id: string, unicode: string) {
    this.unicode = unicode;
    this.id = id;
  }

  static fromRemark(remark: string): Emote | string {
    try {
      validateEmote(remark);
      const [_prefix, _op_type, _version, ...emoteArgs] = remark.split("::");

      const id = remark.slice(
        remark.indexOf(emoteArgs[0]),
        remark.lastIndexOf("::")
      );
      const unicode = emoteArgs[emoteArgs.length - 1] || "";

      return new Emote(id, unicode);
    } catch (e: any) {
      console.error(e.message);
      console.log(`EMOTE error: full input was ${remark}`);
      return e.message;
    }
  }
}
