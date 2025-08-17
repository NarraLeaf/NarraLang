import { KeywordType } from "@/core/lexer/Keyword";
import { OperatorType } from "@/core/lexer/Operator";
import { TokenType, TokensTypeOf } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { parseExpression } from "../expression/ParseExpression";
// TODO: Import parseBlockStatement when implemented
import {
    FunctionDeclarationNode,
    MacroDeclarationNode,
    CleanupDeclarationNode,
} from "./Statement";

/**
 * Parse function parameter with optional default value
 * Supports: name, name = defaultValue, ...restParam
 */
function parseFunctionParam(iterator: ParserIterator): {
    name: string;
    defaultValue: ExpressionNode | null;
    isRest: boolean;
} {
    const ignores: TokenType[] = [TokenType.NewLine];
    let isRest = false;

    iterator.skipNewLine();
    
    // Check for rest parameter (...)
    const restToken = iterator.getCurrentToken();
    if (restToken?.type === TokenType.Operator && restToken.value === OperatorType.Ellipsis) {
        iterator.popToken(); // consume ...
        isRest = true;
    }
    
    // Get parameter name
    const nameToken = iterator.popToken(ignores);
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected parameter name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    let defaultValue: ExpressionNode | null = null;
    
    // Check for default value (only for non-rest parameters)
    if (!isRest) {
        const equalsToken = iterator.getCurrentToken();
        if (equalsToken?.type === TokenType.Operator && equalsToken.value === OperatorType.LogicalEquals) {
            iterator.popToken(); // consume =
            defaultValue = parseExpression(iterator);
            if (!defaultValue) {
                throw new ParserError(
                    ParserErrorType.ExpectedExpression,
                    "Expected default value expression",
                    iterator.getCurrentToken()
                );
            }
        }
    }
    
    return { name, defaultValue, isRest };
}

/**
 * Parse function parameter list: (param1, param2 = default, ...rest)
 */
function parseFunctionParams(iterator: ParserIterator): {
    params: { name: string; defaultValue: ExpressionNode | null }[];
    rest: string | null;
} {
    const ignores: TokenType[] = [TokenType.NewLine];
    const params: { name: string; defaultValue: ExpressionNode | null }[] = [];
    let rest: string | null = null;
    
    // Expect opening parenthesis
    const openParen = iterator.popToken(ignores);
    if (!openParen || openParen.type !== TokenType.Operator || openParen.value !== OperatorType.LeftParenthesis) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '(' after function name",
            openParen
        );
    }
    
    // Parse parameters
    while (true) {
        iterator.skipNewLine();
        
        const token = iterator.getCurrentToken();
        if (!token) {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Unexpected end of file in parameter list",
                null
            );
        }
        
        // Check for closing parenthesis
        if (token.type === TokenType.Operator && token.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        }
        
        // Parse parameter
        const param = parseFunctionParam(iterator);
        
        if (param.isRest) {
            if (rest !== null) {
                throw new ParserError(
                    ParserErrorType.UnknownError,
                    "Only one rest parameter is allowed",
                    token
                );
            }
            rest = param.name;
        } else {
            params.push({ name: param.name, defaultValue: param.defaultValue });
        }
        
        // Check for comma or end
        const nextToken = iterator.getCurrentToken();
        if (nextToken?.type === TokenType.Operator && nextToken.value === OperatorType.Comma) {
            iterator.popToken(); // consume comma
            continue;
        } else if (nextToken?.type === TokenType.Operator && nextToken.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        } else {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Expected ',' or ')' in parameter list, got " + nextToken?.type || "end of file",
                nextToken
            );
        }
    }
    
    return { params, rest };
}

/**
 * Parse macro modifier parameter: *name or *name = defaultValue
 */
function parseMacroModifier(iterator: ParserIterator): {
    name: string;
    defaultValue: ExpressionNode | null;
} {
    // Expect asterisk
    const asteriskToken = iterator.popToken();
    if (!asteriskToken || asteriskToken.type !== TokenType.Operator || asteriskToken.value !== OperatorType.Asterisk) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '*' for macro modifier",
            asteriskToken
        );
    }
    
    // Get modifier name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected modifier name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    let defaultValue: ExpressionNode | null = null;
    
    // Check for default value
    const equalsToken = iterator.getCurrentToken();
    if (equalsToken?.type === TokenType.Operator && equalsToken.value === OperatorType.LogicalEquals) {
        iterator.popToken(); // consume =
        defaultValue = parseExpression(iterator);
        if (!defaultValue) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                "Expected default value expression",
                iterator.getCurrentToken()
            );
        }
    }
    
    return { name, defaultValue };
}

/**
 * Parse macro parameter list: (param1, param2, *mod1, *mod2 = default)
 */
function parseMacroParams(iterator: ParserIterator): {
    params: { name: string; defaultValue: null }[];
    modifiers: { name: string; defaultValue: ExpressionNode | null }[];
} {
    const params: { name: string; defaultValue: null }[] = [];
    const modifiers: { name: string; defaultValue: ExpressionNode | null }[] = [];
    
    // Expect opening parenthesis
    const openParen = iterator.popToken();
    if (!openParen || openParen.type !== TokenType.Operator || openParen.value !== OperatorType.LeftParenthesis) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '(' after macro name",
            openParen
        );
    }
    
    // Parse parameters and modifiers
    while (true) {
        const token = iterator.getCurrentToken();
        if (!token) {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Unexpected end of file in parameter list",
                null
            );
        }
        
        // Check for closing parenthesis
        if (token.type === TokenType.Operator && token.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        }
        
        // Check if it's a modifier (starts with *)
        if (token.type === TokenType.Operator && token.value === OperatorType.Asterisk) {
            const modifier = parseMacroModifier(iterator);
            modifiers.push(modifier);
        } else if (token.type === TokenType.Identifier) {
            // Regular parameter
            const nameToken = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
            params.push({ name: nameToken.value, defaultValue: null });
        } else {
            throw new ParserError(
                ParserErrorType.ExpectedIdentifier,
                "Expected parameter name or modifier",
                token
            );
        }
        
        // Check for comma or end
        const nextToken = iterator.getCurrentToken();
        if (nextToken?.type === TokenType.Operator && nextToken.value === OperatorType.Comma) {
            iterator.popToken(); // consume comma
            continue;
        } else if (nextToken?.type === TokenType.Operator && nextToken.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        } else {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Expected ',' or ')' in parameter list",
                nextToken
            );
        }
    }
    
    return { params, modifiers };
}

/**
 * Parse regular function declaration: function name(params) { body }
 */
export function parseFunctionDeclaration(iterator: ParserIterator): FunctionDeclarationNode {
    const startToken = iterator.popToken(); // consume 'function'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Function) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'function' keyword",
            startToken
        );
    }
    
    // Get function name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected function name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    
    // Parse parameters
    const { params, rest } = parseFunctionParams(iterator);
    
    // Parse function body - TODO: implement parseBlockStatement
    // const body = parseBlockStatement(iterator);
    
    return {
        type: NodeType.FunctionDeclaration,
        trace: { start: startToken.start, end: nameToken.end }, // TODO: update when body parsing is implemented
        name,
        params,
        rest,
        body: [], // TODO: parse actual body statements
    };
}

/**
 * Parse macro function declaration: function! name(params, *modifiers) { body }
 */
export function parseMacroDeclaration(iterator: ParserIterator): MacroDeclarationNode {
    const startToken = iterator.popToken(); // consume 'function!'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Macro) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'function!' keyword",
            startToken
        );
    }
    
    // Get macro name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected macro name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    
    // Parse parameters and modifiers
    const { params, modifiers } = parseMacroParams(iterator);
    
    // Parse macro body - TODO: implement parseBlockStatement
    // const body = parseBlockStatement(iterator);
    
    return {
        type: NodeType.MacroDeclaration,
        trace: { start: startToken.start, end: nameToken.end }, // TODO: update when body parsing is implemented
        name,
        params,
        modifiers,
        body: [], // TODO: parse actual body statements
    };
}

/**
 * Parse cleanup block: cleanup { statements }
 */
export function parseCleanupDeclaration(iterator: ParserIterator): CleanupDeclarationNode {
    const startToken = iterator.popToken(); // consume 'cleanup'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Cleanup) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'cleanup' keyword",
            startToken
        );
    }
    
    // Parse cleanup body - TODO: implement parseBlockStatement
    // const body = parseBlockStatement(iterator);
    
    return {
        type: NodeType.CleanupDeclaration,
        trace: { start: startToken.start, end: startToken.end }, // TODO: update when body parsing is implemented
        body: [], // TODO: parse actual body statements
    };
}
