import { NamedColor } from "../utils/constant";
import { PauseConfig, WordConfig } from "../utils/narraleaf-react";
import { HexString } from "../utils/type";
import { Tokens } from "./Token";

export enum StringTokenType {
    String,
    Expression,
    Tag,
    CloseTag,
}

export type StringToken =
    | { type: StringTokenType.String, value: string }
    | { type: StringTokenType.Expression, value: Tokens[] }
    | { type: StringTokenType.Tag, value: StringTag }
    | { type: StringTokenType.CloseTag };

/* Tag */
export enum StringTagType {
    HexColor,
    NamedColor,
    Bold,
    Italic,
    Pause,
    Word,
}

export type StringTag =
    | { type: StringTagType.HexColor, value: HexString }
    | { type: StringTagType.NamedColor, value: NamedColor }
    | { type: StringTagType.Bold }
    | { type: StringTagType.Italic }
    | { type: StringTagType.Pause, value: PauseConfig }
    | { type: StringTagType.Word, value: WordConfig };
