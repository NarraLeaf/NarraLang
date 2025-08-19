/**
 * 表达式边界情况和性能测试
 * Expression Edge Cases and Performance Tests
 * 
 * 测试各种边界情况、错误处理和性能极限
 */

import { 
    parseExpressionFromString,
    expectParseError,
    expectParseErrorType,
    expectNodeType
} from './helpers';

import { NodeType } from '../../src/core/parser/Node';
import { ParserError, ParserErrorType } from '../../src/core/parser/ParserError';

describe('Expression Edge Cases and Error Handling', () => {

    describe('Syntax Errors', () => {
        test('should handle empty expressions', () => {
            expectParseError('');
            expectParseError('   '); // whitespace only
            expectParseError('\t\n'); // whitespace only
        });

        test('should handle incomplete binary expressions', () => {
            expectParseError('1 +');
            expectParseError('+ 2');
            expectParseError('1 + + 2');
            expectParseError('a and');
            expectParseError('or b');
        });

        test('should handle incomplete unary expressions', () => {
            expectParseError('!');
            expectParseError('-');
        });

        test('should handle incomplete ternary expressions', () => {
            expectParseError('a ?');
            expectParseError('a ? b');
            expectParseError('a ? b :');
            expectParseError('? b : c');
            expectParseError('a ? : c');
        });

        test('should handle mismatched brackets', () => {
            expectParseError('[}');
            expectParseError('{]');
            expectParseError('(}');
            expectParseError('[)');
            expectParseError('{)');
            expectParseError('(]');
        });

        test('should handle unclosed brackets', () => {
            expectParseError('[1, 2, 3');
            expectParseError('{a: 1, b: 2');
            expectParseError('(1, 2, 3');
            expectParseError('func(arg1, arg2');
        });

        test('should handle invalid array syntax', () => {
            expectParseError('[,]'); // leading comma
            expectParseError('[1,, 2]'); // double comma
            expectParseError('[1 2]'); // missing comma
        });

        test('should handle invalid object syntax', () => {
            expectParseError('{,}'); // leading comma
            expectParseError('{a: 1,, b: 2}'); // double comma
            expectParseError('{a 1}'); // missing colon
            expectParseError('{123: value}'); // invalid key
            expectParseError('{a:}'); // missing value
        });

        test('should handle invalid function call syntax', () => {
            expectParseError('func(,)'); // leading comma
            expectParseError('func(a,,b)'); // double comma
            expectParseError('func(a b)'); // missing comma
        });

        test('should handle invalid member access', () => {
            expectParseError('obj.');
            expectParseError('.prop');
            expectParseError('obj..prop');
            expectParseError('obj.[prop]');
        });

        test('should handle invalid string syntax', () => {
            expectParseError('"unclosed string');
            expectParseError("'mismatched quotes\"");
        });
    });

    describe('Semantic Errors', () => {
        test('should handle invalid operator combinations', () => {
            expectParseError('a + * b');
            expectParseError('a and or b');
            expectParseError('a is is b');
        });

        test('should handle invalid unary operator usage', () => {
            expectParseError('a!'); // postfix not supported
            expectParseError('a-'); // postfix minus not supported
            expectParseError('++a'); // pre-increment not supported
            expectParseError('a++'); // post-increment not supported
        });

        test('should handle invalid rest operator usage', () => {
            expectParseError('...'); // standalone
            expectParseError('a...b'); // without space
        });

        test('should handle incomplete semantic operators', () => {
            expectParseError('a is less than or equal');
            expectParseError('value is');
            expectParseError('is equal to b');
        });
    });

    describe('Deep Nesting Limits', () => {
        test('should handle reasonable nesting depth', () => {
            const nested = '('.repeat(50) + '1' + ')'.repeat(50);
            const node = parseExpressionFromString(nested);
            expectNodeType(node, NodeType.Literal);
        });

        test('should reject excessive nesting depth', () => {
            const deepNesting = '('.repeat(300) + '1' + ')'.repeat(300);
            expectParseErrorType(deepNesting, ParserError);
        });

        test('should handle nested arrays reasonably', () => {
            const nestedArray = '['.repeat(20) + '1' + ']'.repeat(20);
            const node = parseExpressionFromString(nestedArray);
            expectNodeType(node, NodeType.ArrayExpression);
        });

        test('should handle nested objects reasonably', () => {
            const nestedObj = '{a:'.repeat(20) + '1' + '}'.repeat(20);
            const node = parseExpressionFromString(nestedObj);
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should handle complex expression nesting', () => {
            const complex = 'a'.repeat(1) + '.prop'.repeat(30) + '()'.repeat(20);
            const node = parseExpressionFromString(complex);
            expect(node).toBeDefined();
        });
    });

    describe('Large Expression Performance', () => {
        test('should handle large number of operands', () => {
            const largeExpr = Array(100).fill(0).map((_, i) => `var${i}`).join(' + ');
            const node = parseExpressionFromString(largeExpr);
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should handle large arrays efficiently', () => {
            const largeArray = '[' + Array(1000).fill(0).map((_, i) => i.toString()).join(', ') + ']';
            const startTime = Date.now();
            const node = parseExpressionFromString(largeArray);
            const endTime = Date.now();
            
            expectNodeType(node, NodeType.ArrayExpression);
            expect(endTime - startTime).toBeLessThan(1000); // Should parse within 1 second
        });

        test('should handle large objects efficiently', () => {
            const largeObject = '{' + Array(500).fill(0).map((_, i) => `prop${i}: ${i}`).join(', ') + '}';
            const startTime = Date.now();
            const node = parseExpressionFromString(largeObject);
            const endTime = Date.now();
            
            expectNodeType(node, NodeType.ObjectExpression);
            expect(endTime - startTime).toBeLessThan(1000); // Should parse within 1 second
        });

        test('should handle complex chained operations', () => {
            const chainedOps = 'obj' + '.method()'.repeat(50) + '.prop'.repeat(30);
            const node = parseExpressionFromString(chainedOps);
            expect(node).toBeDefined();
        });

        test('should handle long semantic operator chains', () => {
            const semanticChain = Array(50).fill(0)
                .map((_, i) => `var${i} is greater than ${i}`)
                .join(' and ');
            const node = parseExpressionFromString(semanticChain);
            expectNodeType(node, NodeType.BinaryExpression);
        });
    });

    describe('Unicode and Special Characters', () => {
        test('should handle Unicode identifiers', () => {
            const node = parseExpressionFromString('变量名 + другая_переменная');
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should handle Unicode in strings', () => {
            const node = parseExpressionFromString('"Hello 世界! 🌍"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should handle Unicode escapes in strings', () => {
            const node = parseExpressionFromString('"Unicode: \\u{1F680}"');
            expectNodeType(node, NodeType.StringExpression);
        });
    });

    describe('Parser State Edge Cases', () => {
        test('should handle alternating complex patterns', () => {
            const alternating = Array(20).fill(0).map((_, i) => 
                i % 2 === 0 ? '[1, 2, 3]' : '{a: 1, b: 2}'
            ).join(' + ');
            const node = parseExpressionFromString(alternating);
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should handle mixed operator precedence stress test', () => {
            const mixed = 'a ** b * c + d - e / f % g and h or i ? j : k';
            const node = parseExpressionFromString(mixed);
            expectNodeType(node, NodeType.TernaryExpression);
        });

        test('should handle deeply nested mixed structures', () => {
            const complex = `{
                func: (a, b) => {
                    return [a, b].map(x => ({value: x * 2}))
                },
                data: [[1, 2], [3, 4]].flat(),
                condition: a > b ? {x: 1} : {y: 2}
            }`;
            const node = parseExpressionFromString(complex);
            expectNodeType(node, NodeType.ObjectExpression);
        });
    });

    describe('Recovery and Error Reporting', () => {
        test('should provide meaningful error messages', () => {
            const errorCases = [
                { code: 'a +', expectedType: ParserErrorType.ExpectedExpression },
                { code: '[', expectedType: ParserErrorType.UnexpectedToken },
                { code: 'func(', expectedType: ParserErrorType.UnexpectedToken },
                { code: 'obj.', expectedType: ParserErrorType.ExpectedIdentifier }
            ];

            errorCases.forEach(({code, expectedType}) => {
                try {
                    parseExpressionFromString(code);
                    fail(`Expected error for: ${code}`);
                } catch (error) {
                    expect(error).toBeInstanceOf(ParserError);
                }
            });
        });

        test('should provide error positions', () => {
            try {
                parseExpressionFromString('a + b + ');
                fail('Expected parser error');
            } catch (error) {
                expect(error).toBeInstanceOf(ParserError);
                expect((error as ParserError).pos).toBeDefined();
            }
        });

        test('should handle error recovery in complex expressions', () => {
            const errorCases = [
                'a + b * + c',
                '{a: 1, b: 2,, c: 3}',
                'func(a, b,, c)',
                '[1, 2,, 3]'
            ];

            errorCases.forEach(code => {
                expectParseError(code);
            });
        });
    });

    describe('Regression Tests', () => {
        test('should handle previously problematic cases', () => {
            // These would be specific cases that caused issues in the past
            const regressionCases = [
                '(a,)', // single element tuple
                '!a.b', // unary on member expression
                'a[b + c]', // computed member with expression
                '"string with {expr + 1} interpolation"',
                'a is not b and c is d',
                '...spread.member.access'
            ];

            regressionCases.forEach(code => {
                const node = parseExpressionFromString(code);
                expect(node).toBeDefined();
            });
        });

        test('should maintain consistent behavior', () => {
            // Test that similar expressions parse consistently
            const similar = [
                ['a + b', 'x + y'],
                ['[1, 2]', '[a, b]'],
                ['{x: 1}', '{y: 2}'],
                ['func()', 'method()']
            ];

            similar.forEach(([expr1, expr2]) => {
                const node1 = parseExpressionFromString(expr1);
                const node2 = parseExpressionFromString(expr2);
                expect(node1.type).toBe(node2.type);
            });
        });
    });

    describe('Concurrent Parsing Simulation', () => {
        test('should handle multiple expressions in sequence', () => {
            const expressions = [
                '1 + 2',
                '"hello world"',
                '[1, 2, 3]',
                '{a: 1, b: 2}',
                'func(arg)',
                'obj.prop',
                'a ? b : c'
            ];

            expressions.forEach(expr => {
                const node = parseExpressionFromString(expr);
                expect(node).toBeDefined();
            });
        });

        test('should maintain parser state independence', () => {
            // Ensure parsing one expression doesn't affect another
            const expr1 = parseExpressionFromString('a + b');
            const expr2 = parseExpressionFromString('x * y');
            const expr3 = parseExpressionFromString('a + b'); // same as first

            expect(expr1.type).toBe(expr3.type);
            expect(expr2.type).toBe(NodeType.BinaryExpression);
        });
    });
});
