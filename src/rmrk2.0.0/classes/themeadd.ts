import { validateThemeadd } from "../tools/validate-remark";
import { VERSION } from "../tools/constants";
import { Theme } from "./base";
import { getRemarkData } from "../tools/utils";

export class Themeadd {
  baseId: string;
  themeId: string;
  theme: Theme;
  static V = VERSION;

  constructor(baseId: string, themeId: string, theme: Theme) {
    this.baseId = baseId;
    this.themeId = themeId;
    this.theme = theme;
  }

  static fromRemark(remark: string): Themeadd | string {
    try {
      validateThemeadd(remark);
      const [
        _prefix,
        _op_type,
        _version,
        baseId,
        themeId,
        theme,
      ] = remark.split("::");
      const themeObj: Theme = getRemarkData(theme);
      return new Themeadd(baseId, themeId, themeObj);
    } catch (e) {
      console.error(e.message);
      console.log(`THEMEADD error: full input was ${remark}`);
      return e.message;
    }
  }
}
