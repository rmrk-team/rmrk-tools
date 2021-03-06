export declare type Options = {
    ws: string;
    from: string;
    to: string;
    prefixes: string;
    blocks: string;
    json: string;
    folder: string;
    append: string;
    remark: string;
};
export declare type BlockCalls = {
    block: number;
    calls: BlockCall[];
};
export declare type BlockCall = {
    call: string;
    value: string;
    caller: string;
};
