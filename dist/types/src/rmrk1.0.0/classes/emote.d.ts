export declare class Emote {
    unicode: string;
    id: string;
    static V: string;
    constructor(id: string, unicode: string);
    static fromRemark(remark: string): Emote | string;
}
