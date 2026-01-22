import { KeywordType } from "@/core/lexer/Keyword";
import { OperatorType } from "@/core/lexer/Operator";
import { TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { parseExpression } from "../expression/ParseExpression";
import { SceneDeclarationNode } from "./Statement";
import { parseBlockStatement } from "./BlockStatement";
import { trace } from "../Trace";
import { ParserProcedureContext } from "../ctx/Contexts";

/**
 * Parse scene declaration: scene SceneName(modifiers) { body }
 * 
 * Syntax:
 * - scene name { body }                          // Simple scene without modifiers
 * - scene name(mod1 expr1, mod2 expr2) { body }  // Scene with modifiers
 * 
 * Examples:
 * - scene IntroScene { ... }
 * - scene DialogueScene(bg "room.png", music "bgm.mp3") { ... }
 * 
 * The scene body is a procedure context that allows:
 * - Dialogue statements
 * - Variable declarations and assignments
 * - Limited control flow (if, loop)
 * - Sugar call statements
 */
export function parseSceneDeclaration(iterator: ParserIterator): SceneDeclarationNode {
    const startToken = iterator.popToken(); // consume 'scene'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Scene) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'scene' keyword",
            startToken
        );
    }
    
    // Get scene name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected scene name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    
    // Parse optional modifiers
    const modifiers = parseSceneModifiers(iterator);
    
    // Parse scene body (procedure context)
    const body = iterator.getContext().context(new ParserProcedureContext(), () => {
        return parseBlockStatement(iterator, {
            allowDialogue: true,
            depth: 0,
            maxDepth: 100,
        });
    });
    
    return {
        type: NodeType.SceneDeclaration,
        trace: trace(startToken.start, body.trace.end),
        name,
        modifiers,
        body: body.body,
    };
}

/**
 * Parse scene modifiers in parentheses: (modifier1 value1, modifier2 value2, ...)
 * 
 * Modifiers are optional key-value pairs that configure the scene.
 * Common modifiers include:
 * - bg: background image
 * - music: background music
 * - transition: scene transition effect
 * 
 * Returns a record mapping modifier names to their expression values.
 */
function parseSceneModifiers(iterator: ParserIterator): Record<string, ExpressionNode> {
    const modifiers: Record<string, ExpressionNode> = {};
    
    iterator.skipNewLine();
    
    // Check if there are modifiers (opening parenthesis)
    const openParen = iterator.getCurrentToken();
    if (!openParen || openParen.type !== TokenType.Operator || openParen.value !== OperatorType.LeftParenthesis) {
        // No modifiers, return empty record
        return modifiers;
    }
    
    iterator.popToken(); // consume (
    
    // Parse modifiers
    while (true) {
        iterator.skipNewLine();
        
        const token = iterator.getCurrentToken();
        if (!token) {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Unexpected end of file in scene modifier list",
                null
            );
        }
        
        // Check for closing parenthesis
        if (token.type === TokenType.Operator && token.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        }
        
        // Parse modifier: name expression
        if (token.type !== TokenType.Identifier) {
            throw new ParserError(
                ParserErrorType.ExpectedIdentifier,
                "Expected modifier name",
                token
            );
        }
        
        const modifierNameToken = iterator.popToken()! as import("@/core/lexer/TokenType").TokensTypeOf<TokenType.Identifier>;
        const modifierName = modifierNameToken.value;
        
        iterator.skipNewLine();
        
        // Parse modifier value expression
        const value = parseExpression(iterator, {
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.Comma },
                { type: TokenType.Operator, value: OperatorType.RightParenthesis },
            ]
        });
        
        if (!value) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                `Expected value for modifier '${modifierName}'`,
                iterator.getCurrentToken()
            );
        }
        
        modifiers[modifierName] = value;
        
        iterator.skipNewLine();
        
        // Check for comma or closing parenthesis
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
                "Expected ',' or ')' in scene modifier list",
                nextToken
            );
        }
    }
    
    return modifiers;
}
