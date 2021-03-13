import { Send } from "../rmrk1.0.0/classes/send";
import { Buy } from "../rmrk1.0.0/classes/buy";
import { List } from "../rmrk1.0.0/classes/list";
import { Emote } from "../rmrk1.0.0/classes/emote";
import { ChangeIssuer } from "../rmrk1.0.0/classes/changeissuer";
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
    extras?: BlockCall[];
};
export declare enum OP_TYPES {
    BUY = "BUY",
    LIST = "LIST",
    MINT = "MINT",
    MINTNFT = "MINTNFT",
    SEND = "SEND",
    EMOTE = "EMOTE",
    CONSUME = "CONSUME",
    CHANGEISSUER = "CHANGEISSUER"
}
export declare type Interaction = Send | Buy | List | Emote | ChangeIssuer;
