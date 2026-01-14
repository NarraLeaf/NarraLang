import { TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { parseExpression } from "../expression/ParseExpression";
import { SugarCallStatementNode } from "./Statement";
import { OperatorType } from "@/core/lexer/Operator";
import { peekOperatorType } from "../expression/shared";

/**
 * Parse a sugar call statement
 * 
 * Sugar syntax: sugarName arg1 arg2 ... modifier1 value1 modifier2 value2
 * Example: image John "url" pos (5,10) scale 1.0
 * 
 * With spread operator: sugarName arg1 ...{mod1: val1, mod2: val2}
 * Example: image John "url" ...{pos: (5,10), scale: 1.0}
 */
export function parseSugarCallStatement(
    iterator: ParserIterator,
    sugarName: string,
    startTrace: number
): SugarCallStatementNode {
    const args: ExpressionNode[] = [];
    const modifiers: Record<string, ExpressionNode> = {};
    
    // Parse arguments
    parseArguments(iterator, args, modifiers);
    
    // Get end position
    const endTrace = iterator.getPreviousToken()?.end ?? startTrace;
    
    return {
        type: NodeType.SugarCallStatement,
        name: sugarName,
        args,
        modifiers,
        trace: { start: startTrace, end: endTrace },
    };
}

/**
 * Parse sugar call arguments and modifiers
 * 
 * Strategy:
 * 1. Parse expressions as arguments
 * 2. Detect modifier pattern: identifier followed by a value where the identifier likely acts as a keyword
 * 3. Heuristic: An identifier is likely a modifier name if:
 *    - It's followed by a parenthesized/bracketed/braced expression (e.g., pos (5,10))
 *    - OR it's lowercase and we already have some arguments
 *    - OR it's preceded by other identifiable modifiers
 * 4. Once we detect a modifier, continue parsing only modifiers
 * 
 * Modifiers are:
 * - identifier expression pairs: pos (5,10)
 * - spread objects: ...{pos: (5,10), scale: 1.0}
 */
function parseArguments(
    iterator: ParserIterator,
    args: ExpressionNode[],
    modifiers: Record<string, ExpressionNode>
): void {
    let parsingModifiers = false;
    
    while (true) {
        const token = iterator.getCurrentToken();
        
        // Stop at newline or end of input
        if (!token || token.type === TokenType.NewLine) {
            break;
        }
        
        // Check for modifier spread: ...object
        if (peekOperatorType(iterator) === OperatorType.Ellipsis) {
            parsingModifiers = true;
            parseModifierSpread(iterator, modifiers);
            continue;
        }
        
        // Check if this could be a modifier name
        if (token.type === TokenType.Identifier) {
            // Look ahead to check if this matches modifier pattern
            const saved = iterator.save();
            const identifierName = token.value;
            iterator.popToken(); // consume identifier
            iterator.skipNewLine();
            
            const nextToken = iterator.getCurrentToken();
            
            // Check if this is likely a modifier based on the next token
            // When parsingModifiers is true, be more lenient to catch additional modifiers
            const hasArgs = args.length > 0;
            if (nextToken && looksLikeModifierPattern(identifierName, nextToken, hasArgs || parsingModifiers)) {
                // Parse as modifier
                parsingModifiers = true;
                const value = parseExpression(iterator, {
                    stopOn: [
                        { type: TokenType.NewLine },
                        { type: TokenType.Operator, value: OperatorType.Ellipsis }
                    ]
                });
                
                if (!value) {
                    throw new ParserError(
                        ParserErrorType.ExpectedExpression,
                        `Expected value for modifier '${identifierName}'`,
                        nextToken
                    );
                }
                
                modifiers[identifierName] = value;
                continue;
            }
            
            // Not a modifier, restore position
            iterator.restore(saved);
            
            // If we're already parsing modifiers, we can't go back to arguments
            if (parsingModifiers) {
                // This identifier doesn't match modifier pattern, so we're done
                break;
            }
        } else if (parsingModifiers) {
            // Non-identifier while parsing modifiers, stop
            break;
        }
        
        // Parse as argument expression
        // Add Ellipsis to stopOn to prevent parseExpression from treating it as infix operator
        const arg = parseExpression(iterator, {
            stopOn: [
                { type: TokenType.NewLine },
                { type: TokenType.Operator, value: OperatorType.Ellipsis }
            ]
        });
        
        if (!arg) {
            break;
        }
        
        // If we're already parsing modifiers, this shouldn't happen
        if (parsingModifiers) {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Cannot have positional arguments after modifiers",
                token
            );
        }
        
        args.push(arg);
    }
}

/**
 * Parse modifier spread syntax: ...object
 */
function parseModifierSpread(
    iterator: ParserIterator,
    modifiers: Record<string, ExpressionNode>
): void {
    const spreadToken = iterator.getCurrentToken()!;
    
    // Consume the ... operator
    iterator.popToken();
    
    // Parse the object expression
    const objectExpr = parseExpression(iterator, {
        stopOn: [{ type: TokenType.NewLine }]
    });
    
    if (!objectExpr) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected object expression after '...'",
            spreadToken
        );
    }
    
    // For object literals, we can extract properties at parse time
    if (objectExpr.type === NodeType.ObjectExpression) {
        // Extract properties from object literal
        // Note: At runtime, spread objects will be merged into modifiers
        // For now, we store the spread expression with a special key
        modifiers[`__spread_${Object.keys(modifiers).length}`] = objectExpr;
    } else {
        // For non-literal objects (variables, etc.), store as spread expression
        modifiers[`__spread_${Object.keys(modifiers).length}`] = objectExpr;
    }
}

/**
 * Check if a token can start an expression
 */
function canStartExpression(token: { type: TokenType }): boolean {
    return (
        token.type === TokenType.Identifier ||
        token.type === TokenType.NumberLiteral ||
        token.type === TokenType.BooleanLiteral ||
        token.type === TokenType.NullLiteral ||
        token.type === TokenType.String ||
        token.type === TokenType.Operator // for unary operators, parens, brackets, braces
    );
}

/**
 * Determine if an identifier followed by a token matches the modifier pattern
 * 
 * Heuristics:
 * 1. If we already have arguments OR are already parsing modifiers:
 *    - Parenthesized/bracketed/braced expression after lowercase identifier = likely modifier
 *    - Simple value after lowercase identifier = likely modifier
 * 2. Without existing arguments:
 *    - Only treat as modifier if identifier is followed by paren/bracket/brace AND
 *      the identifier looks like a keyword (all lowercase, common modifier names)
 * 3. This prevents misidentifying arguments like `obj (expr)` as modifiers
 */
function looksLikeModifierPattern(
    identifierName: string,
    nextToken: { type: TokenType; value?: unknown },
    hasExistingArgsOrModifiers: boolean
): boolean {
    if (!canStartExpression(nextToken)) {
        return false;
    }
    
    const isLowercase = /^[a-z][a-z0-9]*$/i.test(identifierName);
    
    // Check if followed by grouping operators
    const hasGroupingOperator = nextToken.type === TokenType.Operator && (
        nextToken.value === OperatorType.LeftParenthesis ||
        nextToken.value === OperatorType.LeftBracket ||
        nextToken.value === OperatorType.LeftBrace
    );
    
    if (hasExistingArgsOrModifiers) {
        // Once we have arguments or are parsing modifiers, be more lenient
        if (hasGroupingOperator) {
            // Grouping operator after any identifier while parsing modifiers
            return true;
        }
        if (isLowercase && nextToken.type !== TokenType.Identifier) {
            // Lowercase identifier followed by non-identifier value = modifier
            // This prevents "x y" from being parsed as modifier
            return true;
        }
        return false;
    } else {
        // Without existing arguments, be very conservative
        // Only recognize clear modifier patterns to avoid false positives
        
        // Don't treat paren/bracket/brace after identifier as modifier without args
        // This prevents `move obj (expr)` from being parsed as modifier
        // Instead, require explicit indication (existing args or spread operator)
        return false;
    }
}

/**
 * Check if the current parsing context could be a sugar call
 * 
 * Sugar call pattern:
 * - Starts with an identifier (sugar name)
 * - Followed by arguments (expressions) or modifiers
 * - Not a function call (no parentheses immediately after)
 * - Not a member access (no dot immediately after)
 * - Not a binary expression (no binary operator immediately after)
 */
export function couldBeSugarCall(iterator: ParserIterator, expr: ExpressionNode): boolean {
    // Must start with a simple identifier
    if (expr.type !== NodeType.Identifier) {
        return false;
    }
    
    const token = iterator.getCurrentToken();
    if (!token) {
        return false;
    }
    
    // If followed by newline, it's just an identifier expression statement
    if (token.type === TokenType.NewLine) {
        return false;
    }
    
    // Check for operators that would make this a regular expression
    if (token.type === TokenType.Operator) {
        const op = token.value as OperatorType;
        
        // These operators indicate this is NOT sugar syntax
        if (
            op === OperatorType.LeftParenthesis ||       // function call: func()
            op === OperatorType.Dot ||                   // member access: obj.prop
            // Note: LeftBracket is allowed - could be array literal argument
            op === OperatorType.Plus ||                  // binary operators
            op === OperatorType.Minus ||
            op === OperatorType.Asterisk ||
            op === OperatorType.Slash ||
            op === OperatorType.Percent ||
            op === OperatorType.Exponent ||
            op === OperatorType.LogicalEquals ||
            op === OperatorType.LogicalNotEqual ||
            op === OperatorType.LogicalLessThan ||
            op === OperatorType.LogicalGreaterThan ||
            op === OperatorType.LogicalLessThanOrEqual ||
            op === OperatorType.LogicalGreaterThanOrEqual ||
            op === OperatorType.IsLessThan ||
            op === OperatorType.IsGreaterThan ||
            op === OperatorType.IsLessThanOrEqual ||
            op === OperatorType.IsGreaterThanOrEqual ||
            op === OperatorType.IsEqualTo ||
            op === OperatorType.IsNotEqualTo ||
            op === OperatorType.And ||
            op === OperatorType.Or ||
            op === OperatorType.Is ||
            op === OperatorType.IsNot ||
            op === OperatorType.QuestionMark ||          // ternary
            op === OperatorType.Nullish                  // nullish coalescing
        ) {
            return false;
        }
        
        // Ellipsis could be start of modifier spread
        if (op === OperatorType.Ellipsis) {
            return true;
        }
        
        // Other operators might be unary prefix for arguments
        return canStartExpression(token);
    }
    
    // If followed by an expression starter, it could be sugar syntax
    if (canStartExpression(token)) {
        return true;
    }
    
    return false;
}
