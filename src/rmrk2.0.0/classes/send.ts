import { validateSend } from "../tools/validate-remark";
import { isValidAddressPolkadotAddress } from "../tools/consolidator/utils";
import { encodeAddress } from "@polkadot/keyring";

export class Send {
  recipient: string;
  id: string;

  constructor(id: string, recipient: string) {
    this.recipient = recipient;
    this.id = id;
  }

  static fromRemark(remark: string, ss58Format?: number): Send | string {
    try {
      validateSend(remark);
      const [_prefix, _op_type, _version, id, recipient] = remark.split("::");
      let recipientEncoded = recipient;
      if (isValidAddressPolkadotAddress(recipient)) {
        recipientEncoded = encodeAddress(recipient, ss58Format);
      }
      return new Send(id, recipientEncoded);
    } catch (e: any) {
      console.error(e.message);
      console.log(`SEND error: full input was ${remark}`);
      return e.message;
    }
  }
}
