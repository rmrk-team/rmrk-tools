export declare class ChangeIssuer {
    issuer: string;
    id: string;
    static V: string;
    constructor(issuer: string, id: string);
    static fromRemark(remark: string): ChangeIssuer | string;
}
