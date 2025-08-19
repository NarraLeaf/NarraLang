/**
 * NLang特定语法特性测试
 * NLang-Specific Syntax Feature Tests
 * 
 * 测试NLang独有的语法特性：
 * - 语义化运算符 (Semantic operators)
 * - 字符串插值和标签 (String interpolation and tags)
 * - 解构模式 (Destructuring patterns)
 * - 扩展运算符 (Spread operators)
 * - 标识符模式 (Identifier patterns)
 */

import { 
    parseExpressionFromString,
    expectNodeType,
    expectBinaryExpression,
    expectIdentifier,
    expectLiteral,
    expectParseError
} from './helpers';

import { NodeType } from '../../src/core/parser/Node';
import { OperatorType } from '../../src/core/lexer/Operator';
import { 
    BinaryExpressionNode,
    StringExpressionNode,
    ArrayExpressionNode,
    ObjectExpressionNode,
    TupleExpressionNode,
    RestExpressionNode
} from '../../src/core/parser/expression/Expression';

describe('NLang-Specific Expression Features', () => {
    
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

        test('should handle semantic operators in complex expressions', () => {
            const node = parseExpressionFromString('age is greater than 18 and score is less than or equal to 100');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('should handle semantic operators with member expressions', () => {
            const node = parseExpressionFromString('player.score is greater than enemy.score');
            expectBinaryExpression(node, OperatorType.IsGreaterThan);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.left.type).toBe(NodeType.MemberExpression);
            expect(binNode.right.type).toBe(NodeType.MemberExpression);
        });
    });

    describe('String Interpolation', () => {
        test('should parse simple string interpolation', () => {
            const node = parseExpressionFromString('"Hello {name}!"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toHaveLength(3);
            expect(stringNode.value[0]).toBe('Hello ');
            expect(stringNode.value[2]).toBe('!');
            // The middle element should be an expression node for {name}
        });

        test('should parse multiple interpolations', () => {
            const node = parseExpressionFromString('"User {user.name} has {count} items and {money} coins"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toHaveLength(7); // 4 strings + 3 expressions
        });

        test('should parse complex expressions in interpolation', () => {
            const node = parseExpressionFromString('"Result: {a + b * c}"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toHaveLength(2);
            expect(stringNode.value[0]).toBe('Result: ');
        });

        test('should parse nested function calls in interpolation', () => {
            const node = parseExpressionFromString('"Value: {Math.round(score * 100)}"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should parse conditional expressions in interpolation', () => {
            const node = parseExpressionFromString('"Status: {active ? "Active" : "Inactive"}"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should handle empty interpolation', () => {
            expectParseError('"{}"');
        });

        test('should handle interpolation at string boundaries', () => {
            const start = parseExpressionFromString('"{name} is here"');
            const end = parseExpressionFromString('"Hello {name}"');
            const both = parseExpressionFromString('"{greeting} {name}"');
            
            [start, end, both].forEach(node => {
                expectNodeType(node, NodeType.StringExpression);
            });
        });
    });

    describe('Rich String Tags', () => {
        test('should parse string with simple tag', () => {
            const node = parseExpressionFromString('"<b>Bold text</b>"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            // Should contain tag structures
            expect(stringNode.value.length).toBeGreaterThan(0);
        });

        test('should parse string with tag attributes', () => {
            const node = parseExpressionFromString('"<p color="red">Red text</p>"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should parse nested tags', () => {
            const node = parseExpressionFromString('"<b>Bold <i>and italic</i> text</b>"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should parse tags with interpolation', () => {
            const node = parseExpressionFromString('"<p color={"userColor"}>Colored {text}</p>"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should handle hex color tags', () => {
            const node = parseExpressionFromString('"<#FF0000>Red text</>"');
            expectNodeType(node, NodeType.StringExpression);
        });
    });

    describe('Array Destructuring Patterns', () => {
        test('should parse simple array pattern', () => {
            const node = parseExpressionFromString('[a, b, c]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
            arrayNode.elements.forEach(element => {
                expect(element.type).toBe(NodeType.Identifier);
            });
        });

        test('should parse array pattern with rest element', () => {
            const node = parseExpressionFromString('[first, second, ...rest]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
            expect(arrayNode.elements[2].type).toBe(NodeType.RestExpression);
        });

        test('should parse nested array patterns', () => {
            const node = parseExpressionFromString('[[a, b], [c, d]]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(2);
            arrayNode.elements.forEach(element => {
                expect(element.type).toBe(NodeType.ArrayExpression);
            });
        });
    });

    describe('Object Destructuring Patterns', () => {
        test('should parse simple object pattern', () => {
            const node = parseExpressionFromString('{name, age}');
            expectNodeType(node, NodeType.ObjectExpression);
            const objNode = node as ObjectExpressionNode;
            expect(objNode.properties).toHaveLength(2);
        });

        test('should parse object pattern with renamed properties', () => {
            const node = parseExpressionFromString('{name: userName, age: userAge}');
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should parse object pattern with rest element', () => {
            const node = parseExpressionFromString('{name, age, ...others}');
            expectNodeType(node, NodeType.ObjectExpression);
            const objNode = node as ObjectExpressionNode;
            expect(objNode.properties.length).toBeGreaterThan(0);
        });

        test('should parse nested object patterns', () => {
            const node = parseExpressionFromString('{user: {name, age}, config: {theme}}');
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should parse computed property patterns', () => {
            const node = parseExpressionFromString('{[key]: value}');
            expectNodeType(node, NodeType.ObjectExpression);
        });
    });

    describe('Tuple Patterns and Expressions', () => {
        test('should distinguish tuple from grouping', () => {
            const tuple = parseExpressionFromString('(a, b)');
            const group = parseExpressionFromString('(a + b)');
            
            expect(tuple.type).toBe(NodeType.TupleExpression);
            expect(group.type).toBe(NodeType.BinaryExpression);
        });

        test('should parse single-element tuple', () => {
            const node = parseExpressionFromString('(a,)');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(1);
        });

        test('should parse empty tuple', () => {
            const node = parseExpressionFromString('()');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(0);
        });

        test('should parse tuple with rest element', () => {
            const node = parseExpressionFromString('(first, ...rest)');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(2);
            expect(tupleNode.elements[1].type).toBe(NodeType.RestExpression);
        });

        test('should parse nested tuples', () => {
            const node = parseExpressionFromString('((a, b), (c, d))');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(2);
            tupleNode.elements.forEach(element => {
                expect(element.type).toBe(NodeType.TupleExpression);
            });
        });
    });

    describe('Spread Operators', () => {
        test('should parse spread in array literal', () => {
            const node = parseExpressionFromString('[a, ...b, c]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
            expect(arrayNode.elements[1].type).toBe(NodeType.RestExpression);
        });

        test('should parse spread in object literal', () => {
            const node = parseExpressionFromString('{a: 1, ...obj, b: 2}');
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should parse multiple spreads', () => {
            const node = parseExpressionFromString('[...arr1, ...arr2, ...arr3]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
            arrayNode.elements.forEach(element => {
                expect(element.type).toBe(NodeType.RestExpression);
            });
        });

        test('should parse spread with complex expressions', () => {
            const node = parseExpressionFromString('[...obj.method().filter(x => x > 0)]');
            expectNodeType(node, NodeType.ArrayExpression);
        });

        test('should parse spread in function call context', () => {
            const node = parseExpressionFromString('func(...args)');
            expectNodeType(node, NodeType.CallExpression);
        });
    });

    describe('Is In Operator Context', () => {
        test('should work with arrays', () => {
            const node = parseExpressionFromString('item is in [1, 2, 3]');
            expectBinaryExpression(node, OperatorType.IsIn);
        });

        test('should work with tuples', () => {
            const node = parseExpressionFromString('value is in (a, b, c)');
            expectBinaryExpression(node, OperatorType.IsIn);
        });

        test('should work with object keys', () => {
            const node = parseExpressionFromString('key is in obj.keys()');
            expectBinaryExpression(node, OperatorType.IsIn);
        });

        test('should work with complex expressions', () => {
            const node = parseExpressionFromString('user.id is in activeUsers.map(u => u.id)');
            expectBinaryExpression(node, OperatorType.IsIn);
        });
    });

    describe('Identifier Mode Patterns', () => {
        test('should handle array patterns in identifier mode', () => {
            const node = parseExpressionFromString('[a, b, ...rest]');
            expectNodeType(node, NodeType.ArrayExpression);
            // In identifier mode, this would be parsed as a destructuring pattern
        });

        test('should handle object patterns in identifier mode', () => {
            const node = parseExpressionFromString('{x, y, z}');
            expectNodeType(node, NodeType.ObjectExpression);
            // In identifier mode, this would be parsed as a destructuring pattern
        });

        test('should handle tuple patterns in identifier mode', () => {
            const node = parseExpressionFromString('(a, b, c)');
            expectNodeType(node, NodeType.TupleExpression);
            // In identifier mode, this would be parsed as a tuple pattern
        });
    });

    describe('Mixed NLang Features', () => {
        test('should combine semantic operators with destructuring', () => {
            const node = parseExpressionFromString('[a, b] is equal to [1, 2]');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });

        test('should combine string interpolation with semantic operators', () => {
            const node = parseExpressionFromString('"Result: {value}" is equal to expected');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });

        test('should handle spread in semantic comparisons', () => {
            const node = parseExpressionFromString('[...array1] is equal to [...array2]');
            expectBinaryExpression(node, OperatorType.IsEqualTo);
        });

        test('should parse complex real-world examples', () => {
            const examples = [
                '"Player {player.name} has {player.score} points"',
                'score is greater than threshold and lives is greater than 0',
                '[first, ...rest] = items.filter(item => item.active)',
                '{name, age, ...profile} = user.getData()',
                'result is in [1, 2, 3] or backup is not null',
                '"<b>Health:</b> {Math.round(health * 100)}%"'
            ];

            examples.forEach(example => {
                const node = parseExpressionFromString(example);
                expect(node).toBeDefined();
                expect(node.type).toBeDefined();
            });
        });
    });

    describe('Error Handling for NLang Features', () => {
        test('should handle incomplete semantic operators', () => {
            expectParseError('value is greater');
            expectParseError('item is in');
            expectParseError('value is not equal');
        });

        test('should handle invalid string interpolation', () => {
            expectParseError('"unclosed {interpolation"');
            expectParseError('"{incomplete expression"');
        });

        test('should handle invalid destructuring patterns', () => {
            expectParseError('[a, , , b]'); // too many holes
            expectParseError('{...a, ...b}'); // multiple rests in object
        });

        test('should handle invalid spread usage', () => {
            expectParseError('...'); // standalone spread
            expectParseError('[...'); // incomplete spread
        });

        test('should handle mixed quote types in interpolation', () => {
            expectParseError('\'\"mixed {quotes}\"\'');
        });
    });
});
