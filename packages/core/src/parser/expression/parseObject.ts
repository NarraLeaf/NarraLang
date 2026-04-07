import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { createParserIterator, ParserIterator } from "../ParserIterator";
import { IdentifierNode, ObjectExpressionNode, RestExpressionNode, StringExpressionNode, TupleExpressionNode } from "./Expression";
import { parseExpression } from "./ParseExpression";
import { parsePrimary } from "./parsePrimary";
import { parseRichString } from "./parseRichString";
import { consumeOperator, createTrace, ParseExpressionOptions, resetBP } from "./shared";

// Common interface for object property parsing
interface ParsedProperty {
    type: "spread" | "pair";
    node: TupleExpressionNode | RestExpressionNode;
}

// Parse object key (identifier, string, computed property, or dialogue)
function parseObjectKey(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    allowComputedKeys: boolean = true
): IdentifierNode | StringExpressionNode | ExpressionNode {
    const keyTok = iterator.getCurrentToken();
    if (!keyTok) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected object key", null);
    }

    // Computed property: [expression]
    if (allowComputedKeys && keyTok.type === TokenType.Operator && keyTok.value === OperatorType.LeftBracket) {
        const lb = iterator.popToken()!; // consume '['
        const computedKey = parseExpression(iterator, resetBP({
            ...options,
            depth: (options.depth ?? 0) + 1,
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.RightBracket },
            ],
        }));
        
        if (!computedKey) {
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression in computed property", iterator.getCurrentToken() ?? lb);
        }

        const rb = iterator.getCurrentToken();
        if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBracket) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ']' after computed property", rb ?? null);
        }
        iterator.popToken(); // consume ']'
        
        return computedKey;
    }

    // Identifier key
    if (keyTok.type === TokenType.Identifier) {
        const tok = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
        return {
            type: NodeType.Identifier,
            trace: { start: tok.start, end: tok.end },
            name: tok.value,
        };
    }

    // String key
    if (keyTok.type === TokenType.String) {
        const tok = iterator.popToken()! as TokensTypeOf<TokenType.String>;
        const parsed = parseRichString(tok.value);
        return {
            type: NodeType.StringExpression,
            trace: { start: tok.start, end: tok.end },
            value: parsed,
        };
    }

    // Dialogue key (character expression)
    // if (keyTok.type === TokenType.Dialogue) {
    //     const tok = iterator.popToken()! as TokensTypeOf<TokenType.Dialogue>;
    //     const nameIterator = createParserIterator(tok.value.character);
    //     const name = parseExpression(nameIterator, resetBP({ ...options, depth: (options.depth ?? 0) + 1 }));
    //     if (!name) {
    //         throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after dialogue in object literal", tok);
    //     }

    //     const stringValue = parseRichString(tok.value.content);
    //     return {
    //         type: NodeType.StringExpression,
    //         trace: { start: tok.start, end: tok.end },
    //         value: stringValue,
    //     };
    // }

    throw new ParserError(ParserErrorType.UnexpectedToken, "Expected identifier, string, or computed property as object key", keyTok);
}

// Parse spread property: ...expression
function parseSpreadProperty(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    isPattern: boolean = false
): ParsedProperty {
    const spread = parsePrimary(iterator, resetBP({
        ...options,
        depth: (options.depth ?? 0) + 1,
        identifier: isPattern,
        stopOn: [
            { type: TokenType.Operator, value: OperatorType.Comma },
            { type: TokenType.Operator, value: OperatorType.RightBrace },
        ],
    }));
    
    if (!spread || spread.type !== NodeType.RestExpression) {
        const w = iterator.getCurrentToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, `Expected ${isPattern ? "pattern" : "expression"} after '...' in object`, w ?? null);
    }
    
    return {
        type: "spread",
        node: spread as RestExpressionNode
    };
}

// Parse object property (key-value pair)
function parseObjectProperty(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    isPattern: boolean = false
): ParsedProperty {
    const currentToken = iterator.getCurrentToken();
    if (!currentToken) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected object key", null);
    }

    if (currentToken.type === TokenType.Dialogue) {
        iterator.popToken(); // consume dialogue token

        const { character, content } = currentToken.value;
        const nameIterator = createParserIterator(character);
        const name = parseExpression(nameIterator);
        if (!name) {
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after dialogue in object literal", currentToken);
        }

        const parsedContent = parseRichString(content);
        const stringNode: StringExpressionNode = {
            type: NodeType.StringExpression,
            trace: createTrace(character.at(0)!, currentToken.end),
            value: parsedContent,
        };

        const pair: TupleExpressionNode = {
            type: NodeType.TupleExpression,
            trace: createTrace(character.at(0)!, currentToken.end),
            elements: [name, stringNode],
        };
        return {
            type: "pair",
            node: pair
        };
    }

    const keyNode = parseObjectKey(iterator, options, !isPattern);
    
    iterator.skipNewLine();

    // Check for shorthand syntax or method definition
    const afterKey = iterator.getCurrentToken();
    
    // Shorthand property: {key} -> {key: key} (only for identifiers in patterns or object literals)
    if (afterKey && afterKey.type === TokenType.Operator && (
        afterKey.value === OperatorType.Comma ||
        afterKey.value === OperatorType.RightBrace
    )) {
        if (keyNode.type !== NodeType.Identifier) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Shorthand syntax only supported for identifier keys", afterKey);
        }

        const pair: TupleExpressionNode = {
            type: NodeType.TupleExpression,
            trace: { start: keyNode.trace.start, end: keyNode.trace.end },
            elements: [keyNode, keyNode],
        };

        return {
            type: "pair",
            node: pair
        };
    }

    // Method shorthand: key() { ... } (only in object literals, not patterns)
    if (!isPattern && afterKey && afterKey.type === TokenType.Operator && afterKey.value === OperatorType.LeftParenthesis) {
        if (keyNode.type !== NodeType.Identifier) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Method syntax only supported for identifier keys", afterKey);
        }

        // Parse function expression starting from parameters
        const functionExpr = parsePrimary(iterator, resetBP({
            ...options,
            depth: (options.depth ?? 0) + 1,
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.RightParenthesis },
            ],
        }));

        if (!functionExpr) {
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected function expression for method", afterKey);
        }

        const pair: TupleExpressionNode = {
            type: NodeType.TupleExpression,
            trace: { start: keyNode.trace.start, end: functionExpr.trace.end },
            elements: [keyNode, functionExpr],
        };

        return {
            type: "pair",
            node: pair
        };
    }

    // Regular property: key: value
    if (!afterKey || afterKey.type !== TokenType.Operator || afterKey.value !== OperatorType.Colon) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ':' after object key", afterKey ?? null);
    }

    iterator.popToken(); // consume ':'

    const valueExpr = isPattern
        ? parsePrimary(iterator, { ...options, depth: (options.depth ?? 0) + 1, identifier: true })
        : parseExpression(iterator, resetBP({ ...options, depth: (options.depth ?? 0) + 1 }));

    if (!valueExpr) {
        const w = iterator.getCurrentToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, `Expected ${isPattern ? "pattern" : "expression"} after ':' in object`, w ?? afterKey);
    }

    const pair: TupleExpressionNode = {
        type: NodeType.TupleExpression,
        trace: { start: keyNode.trace.start, end: valueExpr.trace.end },
        elements: [keyNode, valueExpr],
    };

    return {
        type: "pair",
        node: pair
    };
}

// Generic object parsing function
function parseObjectGeneric(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    isPattern: boolean = false
): ObjectExpressionNode {
    const lb = iterator.popToken()!; // consume '{'
    const properties: (TupleExpressionNode | RestExpressionNode)[] = [];
    const nextDepth = (options.depth ?? 0) + 1;

    // Empty object
    if (consumeOperator(iterator, OperatorType.RightBrace)) {
        return {
            type: NodeType.ObjectExpression,
            trace: { start: lb.start, end: lb.end },
            properties,
        };
    }

    while (true) {
        const look = iterator.getCurrentToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, `Unclosed object ${isPattern ? "pattern" : "literal"}`, null);
        }

        // Skip newlines
        if (look.type === TokenType.NewLine) {
            iterator.popToken();
            continue;
        }

        // End of object
        if (look.type === TokenType.Operator && look.value === OperatorType.RightBrace) {
            break;
        }

        let parsedProperty: ParsedProperty;

        // Spread property: ...expression
        if (look.type === TokenType.Operator && look.value === OperatorType.Ellipsis) {
            parsedProperty = parseSpreadProperty(iterator, { ...options, depth: nextDepth }, isPattern);
        } else {
            // Regular property: key: value or shorthand
            parsedProperty = parseObjectProperty(iterator, { ...options, depth: nextDepth }, isPattern);
        }

        properties.push(parsedProperty.node);

        iterator.skipNewLine();

        // Check for comma separator
        const sep = iterator.getCurrentToken();
        if (sep && sep.type === TokenType.Operator && sep.value === OperatorType.Comma) {
            iterator.popToken(); // consume ','
            continue;
        }
        break;
    }

    const rb = iterator.getCurrentToken();
    if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBrace) {
        throw new ParserError(ParserErrorType.UnexpectedToken, `Expected '}' to close object ${isPattern ? "pattern" : "literal"}`, rb ?? null);
    }
    iterator.popToken();

    return {
        type: NodeType.ObjectExpression,
        trace: createTrace(lb, rb),
        properties,
    };
}

// Parse object literal: { key: expr, key2: expr2, ...spread, [computed]: value }
export function parseObjectLiteral(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ObjectExpressionNode {
    return parseObjectGeneric(iterator, options, false);
}

// Parse object pattern for identifier mode: { a, b: c, ...rest }
export function parseObjectPattern(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ExpressionNode {
    return parseObjectGeneric(iterator, options, true);
}