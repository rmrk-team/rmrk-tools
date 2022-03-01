import { validateChangeIssuer } from "../../tools/validate-remark";
import { isValidAddressPolkadotAddress } from "../../tools/consolidator/utils";
import { encodeAddress } from "@polkadot/keyring";

export class ChangeIssuer {
  issuer: string;
  id: string;

  constructor(issuer: string, id: string) {
    this.issuer = issuer;
    this.id = id;
  }

  static fromRemark(
    remark: string,
    ss58Format?: number
  ): ChangeIssuer | string {
    const exploded = remark.split("::");
    try {
      validateChangeIssuer(remark);
      const [prefix, op_type, version, id, issuer] = remark.split("::");
      let encodedIssuer = issuer;
      if (isValidAddressPolkadotAddress(issuer)) {
        encodedIssuer = encodeAddress(issuer, ss58Format);
      }
      return new ChangeIssuer(encodedIssuer, id);
    } catch (e: any) {
      console.error(e.message);
      console.log(`CHANGEISSUER error: full input was ${remark}`);
      return e.message;
    }
  }
}
