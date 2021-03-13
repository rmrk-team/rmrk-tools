import { BlockCall } from "../types";
export declare type Remark = {
    block: number;
    interaction_type: string;
    caller: string;
    version: string;
    remark: string;
    extra_ex?: BlockCall[];
};
export declare type Extrinsic = {
    module: string;
    method: string;
    arg: string;
};
