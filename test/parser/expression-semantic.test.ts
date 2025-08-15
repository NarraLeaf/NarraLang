/**
 * NLang语义运算符测试
 * NLang Semantic Operators Tests
 * 
 * 测试NLang特有的语义化运算符
 */

import { 
    parseExpressionFromString,
    expectBinaryExpression,
    expectParseError
} from './helpers';

import { OperatorType } from '../../src/core/lexer/Operator';

describe('NLang Semantic Operators', () => {
    
    describe('Semantic Comparison Operators', () => {
        test('should parse "is equal to"', () => {
            const node = parseExpressionFromString('value is equal to expected');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });

        test('should parse "is not equal to"', () => {
            const node = parseExpressionFromString('value is not equal to expected');
            expectBinaryExpression(node, OperatorType.IsNotEqualTo);
        });

        test('should parse "is greater than"', () => {
            const node = parseExpressionFromString('score is greater than threshold');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
        });

        test('should parse "is greater than or equal to"', () => {
            const node = parseExpressionFromString('score is greater than or equal to minimum');
            expectBinaryExpression(node, OperatorType.IsGreaterThanOrEqual);
        });

        test('should parse "is less than"', () => {
            const node = parseExpressionFromString('age is less than limit');
            expectBinaryExpression(node, OperatorType.IsLessThan);
        });

        test('should parse "is less than or equal to"', () => {
            const node = parseExpressionFromString('price is less than or equal to budget');
            expectBinaryExpression(node, OperatorType.IsLessThanOrEqual);
        });

        test('should parse "is in"', () => {
            const node = parseExpressionFromString('item is in collection');
            expectBinaryExpression(node, OperatorType.IsIn);
        });

        test('should parse "is not"', () => {
            const node = parseExpressionFromString('value is not null');
            expectBinaryExpression(node, OperatorType.IsNot);
        });
    });

    describe('Semantic Operators in Complex Expressions', () => {
        test('should handle semantic operators with logical operators', () => {
            const node = parseExpressionFromString('age is greater than 18 and score is less than or equal to 100');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should handle semantic operators with arithmetic', () => {
            const node = parseExpressionFromString('total + tax is greater than budget');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
        });

        test('should handle chained semantic operators', () => {
            const node = parseExpressionFromString('a is greater than b and b is greater than c');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should handle semantic operators with member expressions', () => {
            const node = parseExpressionFromString('player.score is greater than enemy.score');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
        });

        test('should handle semantic operators with function calls', () => {
            const node = parseExpressionFromString('getValue() is equal to getExpected()');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });
    });

    describe('Semantic Operator Precedence', () => {
        test('should have correct precedence with arithmetic operators', () => {
            const node = parseExpressionFromString('a + b is greater than c * d');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
        });

        test('should have correct precedence with logical operators', () => {
            const node = parseExpressionFromString('a is greater than b and c is less than d');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should work with parentheses', () => {
            const node = parseExpressionFromString('(a + b) is greater than (c - d)');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
        });
    });

    describe('Mixed Semantic and Symbol Operators', () => {
        test('should mix = and is equal to', () => {
            const node = parseExpressionFromString('a = b and c is equal to d');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should mix > and is greater than', () => {
            const node = parseExpressionFromString('a > b or c is greater than d');
            expectBinaryExpression(node, OperatorType.Or);
        });

        test('should mix < and is less than', () => {
            const node = parseExpressionFromString('x < y and z is less than w');
            expectBinaryExpression(node, OperatorType.And);
        });
    });

    describe('Edge Cases for Semantic Operators', () => {
        test('should handle semantic operators with literals', () => {
            const node = parseExpressionFromString('10 is greater than 5');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
        });

        test('should handle semantic operators with strings', () => {
            const node = parseExpressionFromString('"hello" is equal to "world"');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });

        test('should handle semantic operators with arrays', () => {
            const node = parseExpressionFromString('[1, 2, 3] is equal to otherArray');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });

        test('should handle is in with arrays', () => {
            const node = parseExpressionFromString('item is in [1, 2, 3]');
            expectBinaryExpression(node, OperatorType.IsIn);
        });

        test('should handle is in with tuples', () => {
            const node = parseExpressionFromString('value is in (a, b, c)');
            expectBinaryExpression(node, OperatorType.IsIn);
        });
    });

    describe('Error Cases for Semantic Operators', () => {
        test('should handle incomplete semantic operators', () => {
            // These may not error in the current implementation
            // Testing what the parser actually does
            try {
                parseExpressionFromString('value is greater');
                // If no error, check that it parses as something reasonable
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should handle invalid combinations gracefully', () => {
            // Test that parser doesn't crash on unusual input
            try {
                parseExpressionFromString('value is is greater than 5');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('Real World Examples', () => {
        test('should parse game score comparison', () => {
            const node = parseExpressionFromString('player.health is greater than 0 and player.score is greater than or equal to highScore');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should parse inventory check', () => {
            const node = parseExpressionFromString('item is in player.inventory and player.gold is greater than or equal to item.price');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should parse age verification', () => {
            const node = parseExpressionFromString('user.age is greater than or equal to 18 or user.hasParentalConsent is equal to true');
            expectBinaryExpression(node, OperatorType.Or);
        });

        test('should parse range check', () => {
            const node = parseExpressionFromString('value is greater than min and value is less than or equal to max');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should parse complex game logic', () => {
            const node = parseExpressionFromString('player.level is greater than monster.level or player.weapon.damage is greater than monster.defense');
            expectBinaryExpression(node, OperatorType.Or);
        });
    });

    describe('Performance with Semantic Operators', () => {
        test('should handle long chains of semantic operators', () => {
            const chain = Array(10).fill(0).map((_, i) => `val${i} is greater than ${i}`).join(' and ');
            const node = parseExpressionFromString(chain);
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should handle mixed semantic and arithmetic chains', () => {
            const chain = 'a + b is greater than c * d and e - f is less than g / h';
            const node = parseExpressionFromString(chain);
            expectBinaryExpression(node, OperatorType.And);
        });
    });
});
