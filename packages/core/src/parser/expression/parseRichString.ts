import { StringTagType, StringToken, StringTokenType } from "@/core/lexer/String";
import { ExpressionNode } from "../Node";
import { StringTag } from "./Expression";
import { parseExpression } from "./ParseExpression";
import { createParserIterator } from "../ParserIterator";
import { ParserError, ParserErrorType } from "../ParserError";

export type ParsedString = (string | StringTag | ExpressionNode)[];
export function parseRichString(tokens: StringToken[]): ParsedString {
    const result: ParsedString = [];
    const indexOfNextCloseTagFrom = (fromIndex: number, name: Exclude<StringTagType, StringTagType.HexColor> | string | null) => {
        for (let j = fromIndex; j < tokens.length; j++) {
            const token = tokens[j];
            if (token.type === StringTokenType.CloseTag
                && token.value === name
            ) {
                return j;
            }
        }
        return -1;
    };

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === StringTokenType.String) {
            result.push(token.value);
        } else if (token.type === StringTokenType.Expression) {
            const iterator = createParserIterator(token.value);
            const parsedExpression = parseExpression(iterator);
            if (parsedExpression) {
                result.push(parsedExpression);
            } else {
                // Handle expression parsing failure
                throw new ParserError(ParserErrorType.UnexpectedToken, "Failed to parse expression in string");
            }
        } else if (token.type === StringTokenType.Tag) {
            const { closed, properties, ...tag } = token.value;
            if (closed) {
                result.push({
                    tag,
                    properties,
                    children: [],
                });
                continue;
            }

            const startIndex = i + 1; // skip current tag
            const nextCloseTag = indexOfNextCloseTagFrom(
                startIndex,
                tag.type === StringTagType.HexColor ? null : tag.type
            );

            if (nextCloseTag === -1) {
                throw new ParserError(ParserErrorType.UnexpectedToken, "Unexpected end of string (tag not closed)");
            }

            i = nextCloseTag; // will be incremented by for loop
            const tagChildren = tokens.slice(startIndex, nextCloseTag); // from start to next close tag (exclusive)
            const parsedChildren = parseRichString(tagChildren);
            result.push({
                tag,
                properties,
                children: parsedChildren,
            });
        } else if (token.type === StringTokenType.CloseTag) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unexpected close tag: " + (token.value || ""));
        }
    }
    return result;
}

