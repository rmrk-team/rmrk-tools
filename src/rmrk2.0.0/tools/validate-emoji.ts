import stringFromCodePoint from "./polyfill-string-from-codepoint";
import emojiRegex from "emoji-regex/text";

/**
 * Converted dashed emoji unicodes into native emoji unicode with prefix
 * @param unified - emoji unicode
 */
export const unifiedToNative = (unified: string) => {
  try {
    const unicodes = unified
      .replace(/([U+]){2}/g, "")
      .split(unified.includes("-") ? "-" : " ");
    const codePoints = unicodes.map((u) => (u ? `0x${u}` : ""));

    return stringFromCodePoint(
      ...codePoints.map((codePoint) => Number(codePoint))
    );
  } catch (error: any) {
    return "";
  }
};

/**
 * Validate emoji
 * @param emoji
 */
export const isValidEmoji = (emoji: string) => {
  const unified = unifiedToNative(emoji);
  const regex = emojiRegex();
  return regex.test(unified);
};
