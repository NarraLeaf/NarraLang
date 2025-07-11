import { NamedColor } from "./constant";

export type HexColor = `#${string}`;
export type RGBAColor = {
    r: number;
    g: number;
    b: number;
    a?: number;
};
export type Color = NamedColor | RGBAColor | HexColor;

export type PauseConfig = {
    duration?: number;
};

export type WordConfig = {
    className: string;
    ruby: string;
    color: Color;
    pause: boolean;
    cps?: number;
} & Font;
export type Font = {
    italic?: boolean;
    bold?: boolean;
    fontFamily?: string;
    fontSize?: string;
};
