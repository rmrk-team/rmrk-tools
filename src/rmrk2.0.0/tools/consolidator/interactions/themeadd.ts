import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";
import { Themeadd } from "../../../classes/themeadd";
import { Base } from "../../../classes/base";

export const themeAddInteraction = (
  remark: Remark,
  themeaddEntity: Themeadd,
  base?: Base
) => {
  if (!base) {
    throw new Error(
      `[${OP_TYPES.THEMEADD}] Attempting to add a theme to a non-existant Base ${themeaddEntity.baseId}`
    );
  }

  if (base.themes?.[themeaddEntity.themeId]) {
    throw new Error(
      `[${OP_TYPES.THEMEADD}] Attempting to add a theme with an already existing theme key ${themeaddEntity.themeId}`
    );
  }

  if (!base.themes) {
    base.themes = {};
  }

  base.themes[themeaddEntity.themeId] = themeaddEntity.theme;
};
