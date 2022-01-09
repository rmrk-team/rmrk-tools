import { validateSend } from "../../tools/validate-remark";

export class Send {
  recipient: string;
  id: string;

  constructor(id: string, recipient: string) {
    this.recipient = recipient;
    this.id = id;
  }

  static fromRemark(remark: string): Send | string {
    try {
      validateSend(remark);
      const [_prefix, _op_type, _version, ...sendArgs] = remark.split("::");
      const id = remark.slice(
        remark.indexOf(sendArgs[0]),
        remark.lastIndexOf("::")
      );
      const recipient = sendArgs.at(-1) || "";

      return new Send(id, recipient);
    } catch (e: any) {
      console.error(e.message);
      console.log(`SEND error: full input was ${remark}`);
      return e.message;
    }
  }
}
