import { Attribute } from "../types/attribute";
export declare class NFT {
}
export interface NFTMetadata {
    external_url?: string;
    image?: string;
    image_data?: string;
    description?: string;
    name?: string;
    attributes: Attribute[];
    background_color?: string;
    animation_url?: string;
    youtube_url?: string;
}
