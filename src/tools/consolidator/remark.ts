import { BlockCall } from "../types";

export type Remark = {
  block: number;
  interaction_type: string;
  caller: string;
  version: string;
  remark: string;
  extra_ex?: BlockCall[];
};

export type Extrinsic = {
  module: string;
  method: string;
  arg: string;
};
