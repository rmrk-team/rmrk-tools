export declare class Send {
    recipient: string;
    id: string;
    static V: string;
    constructor(id: string, recipient: string);
    static fromRemark(remark: string): Send | string;
}
