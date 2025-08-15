/**
 * 基础表达式解析测试
 * Basic Expression Parser Tests
 * 
 * 这个文件包含基础的、确认可以工作的表达式测试
 */

import { 
    parseExpressionFromString,
    expectParseError,
    expectNodeType,
    expectBinaryExpression,
    expectIdentifier,
    expectLiteral
} from './helpers';

import { NodeType } from '../../src/core/parser/Node';
import { OperatorType } from '../../src/core/lexer/Operator';
import { 
    BinaryExpressionNode,
    UnaryExpressionNode,
    ArrayExpressionNode,
    TupleExpressionNode,
    StringExpressionNode
} from '../../src/core/parser/expression/Expression';

describe('Basic Expression Parser Tests', () => {
    
    describe('Literal Expressions', () => {
        test('should parse number literals', () => {
            const node = parseExpressionFromString('42');
            expectNodeType(node, NodeType.Literal);
            expectLiteral(node, 42);
        });

        test('should parse float literals', () => {
            const node = parseExpressionFromString('3.14');
            expectNodeType(node, NodeType.Literal);
            expectLiteral(node, 3.14);
        });

        test('should parse scientific notation', () => {
            const node = parseExpressionFromString('1e8');
            expectNodeType(node, NodeType.Literal);
            expectLiteral(node, 1e8);
        });

        test('should parse decimal variants', () => {
            const tests = ['.256', '256.', '0.256'];
            tests.forEach(test => {
                const node = parseExpressionFromString(test);
                expectNodeType(node, NodeType.Literal);
                expect((node as any).value).toBeCloseTo(parseFloat(test));
            });
        });
    });

    describe('Identifier Expressions', () => {
        test('should parse simple identifiers', () => {
            const node = parseExpressionFromString('myVar');
            expectNodeType(node, NodeType.Identifier);
            expectIdentifier(node, 'myVar');
        });

        test('should parse identifiers with underscores', () => {
            const node = parseExpressionFromString('my_var_name');
            expectNodeType(node, NodeType.Identifier);
            expectIdentifier(node, 'my_var_name');
        });

        test('should parse identifiers with numbers', () => {
            const node = parseExpressionFromString('var123');
            expectNodeType(node, NodeType.Identifier);
            expectIdentifier(node, 'var123');
        });
    });

    describe('String Expressions', () => {
        test('should parse simple string', () => {
            const node = parseExpressionFromString('"hello world"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toContain('hello world');
        });

        test('should parse single quoted string', () => {
            const node = parseExpressionFromString("'hello world'");
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toContain('hello world');
        });

        test('should handle basic string interpolation', () => {
            const node = parseExpressionFromString('"Hello {name}!"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value.length).toBeGreaterThan(1);
        });
    });

    describe('Binary Expressions - Arithmetic', () => {
        test('should parse addition', () => {
            const node = parseExpressionFromString('1 + 2');
            expectBinaryExpression(node, OperatorType.Plus);
        });

        test('should parse subtraction', () => {
            const node = parseExpressionFromString('5 - 3');
            expectBinaryExpression(node, OperatorType.Minus);
        });

        test('should parse multiplication', () => {
            const node = parseExpressionFromString('2 * 4');
            expectBinaryExpression(node, OperatorType.Asterisk);
        });

        test('should parse division', () => {
            const node = parseExpressionFromString('8 / 2');
            expectBinaryExpression(node, OperatorType.Slash);
        });

        test('should parse modulo', () => {
            const node = parseExpressionFromString('5 % 3');
            expectBinaryExpression(node, OperatorType.Percent);
        });

        test('should parse exponentiation', () => {
            const node = parseExpressionFromString('2 ** 3');
            expectBinaryExpression(node, OperatorType.Exponent);
        });
    });

    describe('Binary Expressions - Comparison', () => {
        test('should parse equality', () => {
            const node = parseExpressionFromString('a = b');
            expectBinaryExpression(node, OperatorType.LogicalEquals);
        });

        test('should parse inequality', () => {
            const node = parseExpressionFromString('a != b');
            expectBinaryExpression(node, OperatorType.LogicalNotEqual);
        });

        test('should parse greater than', () => {
            const node = parseExpressionFromString('a > b');
            expectBinaryExpression(node, OperatorType.LogicalGreaterThan);
        });

        test('should parse less than', () => {
            const node = parseExpressionFromString('a < b');
            expectBinaryExpression(node, OperatorType.LogicalLessThan);
        });

        test('should parse greater than or equal', () => {
            const node = parseExpressionFromString('a >= b');
            expectBinaryExpression(node, OperatorType.LogicalGreaterThanOrEqual);
        });

        test('should parse less than or equal', () => {
            const node = parseExpressionFromString('a <= b');
            expectBinaryExpression(node, OperatorType.LogicalLessThanOrEqual);
        });
    });

    describe('Binary Expressions - Logical', () => {
        test('should parse logical and', () => {
            const node = parseExpressionFromString('a and b');
            expectBinaryExpression(node, OperatorType.And);
        });

        test('should parse logical or', () => {
            const node = parseExpressionFromString('a or b');
            expectBinaryExpression(node, OperatorType.Or);
        });

        test('should parse is operator', () => {
            const node = parseExpressionFromString('a is b');
            expectBinaryExpression(node, OperatorType.Is);
        });
    });

    describe('Unary Expressions', () => {
        test('should parse logical not with !', () => {
            const node = parseExpressionFromString('!a');
            expectNodeType(node, NodeType.UnaryExpression);
            const unaryNode = node as UnaryExpressionNode;
            expect(unaryNode.condition.type).toBe(NodeType.Identifier);
        });

        test('should parse unary minus', () => {
            const node = parseExpressionFromString('-42');
            expectNodeType(node, NodeType.UnaryExpression);
            const unaryNode = node as UnaryExpressionNode;
            expect(unaryNode.condition.type).toBe(NodeType.Literal);
        });
    });

    describe('Array Expressions', () => {
        test('should parse empty array', () => {
            const node = parseExpressionFromString('[]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(0);
        });

        test('should parse array with elements', () => {
            const node = parseExpressionFromString('[1, 2, 3]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
        });

        test('should parse array with mixed types', () => {
            const node = parseExpressionFromString('[1, a, "hello"]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
        });

        test('should parse nested arrays', () => {
            const node = parseExpressionFromString('[[1, 2], [3, 4]]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(2);
            expect(arrayNode.elements[0].type).toBe(NodeType.ArrayExpression);
        });
    });

    describe('Tuple Expressions', () => {
        test('should parse empty tuple', () => {
            const node = parseExpressionFromString('()');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(0);
        });

        test('should parse multi-element tuple', () => {
            const node = parseExpressionFromString('(1, 2, 3)');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(3);
        });

        test('should distinguish tuple from grouping', () => {
            const grouping = parseExpressionFromString('(1 + 2)');
            const tuple = parseExpressionFromString('(1, 2)');
            
            expect(grouping.type).toBe(NodeType.BinaryExpression);
            expect(tuple.type).toBe(NodeType.TupleExpression);
        });
    });

    describe('Operator Precedence', () => {
        test('should handle multiplication before addition', () => {
            const node = parseExpressionFromString('1 + 2 * 3');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Plus);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
            const rightNode = binNode.right as BinaryExpressionNode;
            expect(rightNode.operator).toBe(OperatorType.Asterisk);
        });

        test('should handle exponentiation before multiplication', () => {
            const node = parseExpressionFromString('2 * 3 ** 2');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Asterisk);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('should handle parentheses override precedence', () => {
            const node = parseExpressionFromString('(1 + 2) * 3');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Asterisk);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
        });

        test('should handle logical operator precedence', () => {
            const node = parseExpressionFromString('a and b or c');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Or);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
        });
    });

    describe('Right Associativity', () => {
        test('should handle right-associative exponentiation', () => {
            const node = parseExpressionFromString('2 ** 3 ** 2');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Exponent);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });
    });

    describe('Member and Call Expressions', () => {
        test('should parse property access', () => {
            const node = parseExpressionFromString('obj.prop');
            expectNodeType(node, NodeType.MemberExpression);
        });

        test('should parse chained property access', () => {
            const node = parseExpressionFromString('obj.prop.subProp');
            expectNodeType(node, NodeType.MemberExpression);
        });

        test('should parse function call with no arguments', () => {
            const node = parseExpressionFromString('func()');
            expectNodeType(node, NodeType.CallExpression);
        });

        test('should parse function call with arguments', () => {
            const node = parseExpressionFromString('func(1, 2, 3)');
            expectNodeType(node, NodeType.CallExpression);
        });

        test('should parse method call', () => {
            const node = parseExpressionFromString('obj.method(arg)');
            expectNodeType(node, NodeType.CallExpression);
        });
    });

    describe('Error Handling', () => {
        test('should handle empty expressions', () => {
            expectParseError('');
        });

        test('should handle incomplete binary expressions', () => {
            expectParseError('1 +');
            expectParseError('+ 2');
        });

        test('should handle unclosed brackets', () => {
            expectParseError('[1, 2, 3');
            expectParseError('(1, 2, 3');
        });

        test('should handle mismatched brackets', () => {
            expectParseError('[}');
            expectParseError('{]');
            expectParseError('(}');
        });

        test('should handle invalid member access', () => {
            expectParseError('obj.');
            expectParseError('.prop');
        });
    });

    describe('Complex but Working Expressions', () => {
        test('should parse complex arithmetic', () => {
            const node = parseExpressionFromString('1 + 2 * 3 - 4 / 2');
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should parse mixed logical and arithmetic', () => {
            const node = parseExpressionFromString('a > 5 and b < 10');
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should parse array access chain', () => {
            const node = parseExpressionFromString('array[0].prop.method()');
            expect(node).toBeDefined();
        });

        test('should parse nested function calls', () => {
            const node = parseExpressionFromString('outer(inner(value))');
            expectNodeType(node, NodeType.CallExpression);
        });
    });
});
