export declare class Buy {
    price: BigInt;
    id: string;
    constructor(id: string, price: BigInt);
    static fromRemark(remark: string): Buy | string;
}
