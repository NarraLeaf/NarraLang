import { lexer } from "../../src/index";
import { LexerError } from "../../src/core/lexer/LexerError";
import { OperatorType } from "../../src/core/lexer/Operator";
import { TokenType } from "../../src/core/lexer/TokenType";

describe('Debug Lambda Lexing', () => {
    test('should lex arrow operator correctly', () => {
        const tokens = lexer('=>');
        
        if (LexerError.isLexerError(tokens)) {
            throw new Error(`Lexer error: ${tokens.message}`);
        }
        
        console.log('Tokens for "=>":', tokens);
        console.log('OperatorType.Arrow value:', OperatorType.Arrow);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Operator);
        if (tokens[0].type === TokenType.Operator) {
            expect(tokens[0].value).toBe(OperatorType.Arrow);
        }
    });

    test('should lex simple lambda expression', () => {
        const tokens = lexer('(x) => x');
        
        if (LexerError.isLexerError(tokens)) {
            throw new Error(`Lexer error: ${tokens.message}`);
        }
        
        console.log('Tokens for "(x) => x":', tokens.map(t => ({ 
            type: t.type, 
            value: t.type === TokenType.Operator ? t.value : 
                   t.type === TokenType.Identifier ? t.value :
                   t.type === TokenType.Keyword ? t.value : 'N/A'
        })));
        
        // Find arrow token
        const arrowToken = tokens.find(t => t.type === TokenType.Operator && 
                                            (t as any).value === OperatorType.Arrow);
        expect(arrowToken).toBeDefined();
    });
});
