export declare class List {
    price: BigInt;
    id: string;
    static V: string;
    constructor(id: string, price: BigInt);
    static fromRemark(remark: string): List | string;
}
