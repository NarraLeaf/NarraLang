/**
 * 表达式解析器单元测试
 * Expression Parser Unit Tests
 * 
 * 测试覆盖范围：
 * - Basic expressions (literals, identifiers, strings)
 * - Binary expressions (arithmetic, logical, comparison operators)
 * - Unary expressions (logical not, unary minus)
 * - Complex expressions (arrays, objects, tuples, spread)
 * - Call expressions (function calls, member access)
 * - Ternary expressions (conditional operator)
 * - Edge cases (error handling, syntax errors, deep nesting)
 * - Special features (string interpolation, destructuring)
 */

import { 
    parseExpressionFromString,
    expectParseError,
    expectParseErrorType,
    createIdentifier,
    createLiteral,
    createBinaryExpression,
    expectNodeType,
    expectBinaryExpression,
    expectIdentifier,
    expectLiteral
} from './helpers';

import { NodeType } from '../../src/core/parser/Node';
import { OperatorType } from '../../src/core/lexer/Operator';
import { ParserError } from '../../src/core/parser/ParserError';
import { 
    BinaryExpressionNode,
    UnaryExpressionNode,
    TernaryExpressionNode,
    CallExpressionNode,
    MemberExpressionNode,
    ArrayExpressionNode,
    ObjectExpressionNode,
    TupleExpressionNode,
    StringExpressionNode,
    RestExpressionNode
} from '../../src/core/parser/expression/Expression';

describe('Expression Parser', () => {
    
    describe('Basic Expressions', () => {
        describe('Literals', () => {
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

            test('should parse boolean literals', () => {
                const trueNode = parseExpressionFromString('true');
                const falseNode = parseExpressionFromString('false');
                
                expectNodeType(trueNode, NodeType.Literal);
                expectNodeType(falseNode, NodeType.Literal);
                expectLiteral(trueNode, true);
                expectLiteral(falseNode, false);
            });

            test('should parse null literal', () => {
                const node = parseExpressionFromString('null');
                expectNodeType(node, NodeType.Literal);
                expectLiteral(node, null);
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

        describe('Identifiers', () => {
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

            test('should parse Unicode identifiers', () => {
                const node = parseExpressionFromString('变量名');
                expectNodeType(node, NodeType.Identifier);
                expectIdentifier(node, '变量名');
            });
        });

        describe('String Expressions', () => {
            test('should parse simple string', () => {
                const node = parseExpressionFromString('"hello world"');
                expectNodeType(node, NodeType.StringExpression);
                const stringNode = node as StringExpressionNode;
                expect(stringNode.value).toEqual(['hello world']);
            });

            test('should parse single quoted string', () => {
                const node = parseExpressionFromString("'hello world'");
                expectNodeType(node, NodeType.StringExpression);
                const stringNode = node as StringExpressionNode;
                expect(stringNode.value).toEqual(['hello world']);
            });

            test('should parse empty string', () => {
                const node = parseExpressionFromString('""');
                expectNodeType(node, NodeType.StringExpression);
                const stringNode = node as StringExpressionNode;
                expect(stringNode.value).toEqual([]);
            });

            test('should handle string interpolation', () => {
                const node = parseExpressionFromString('"Hello {name}!"');
                expectNodeType(node, NodeType.StringExpression);
                const stringNode = node as StringExpressionNode;
                expect(stringNode.value).toHaveLength(3); // "Hello ", {name}, "!"
                expect(stringNode.value[0]).toBe('Hello ');
                expect(stringNode.value[2]).toBe('!');
            });

            test('should handle escape sequences', () => {
                const node = parseExpressionFromString('"hello\\nworld"');
                expectNodeType(node, NodeType.StringExpression);
            });
        });
    });

    describe('Binary Expressions', () => {
        describe('Arithmetic Operators', () => {
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

        describe('Comparison Operators', () => {
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

        describe('Logical Operators', () => {
            test('should parse logical and', () => {
                const node = parseExpressionFromString('true and false');
                expectBinaryExpression(node, OperatorType.And);
            });

            test('should parse logical or', () => {
                const node = parseExpressionFromString('true or false');
                expectBinaryExpression(node, OperatorType.Or);
            });

            test('should parse nullish coalescing', () => {
                const node = parseExpressionFromString('a ?? b');
                expectBinaryExpression(node, OperatorType.Nullish);
            });

            test('should parse is operator', () => {
                const node = parseExpressionFromString('a is b');
                expectBinaryExpression(node, OperatorType.Is);
            });
        });

        describe('Semantic Operators', () => {
            test('should parse "is not"', () => {
                const node = parseExpressionFromString('a is not b');
                expectBinaryExpression(node, OperatorType.IsNot);
            });

            test('should parse "is equal to"', () => {
                const node = parseExpressionFromString('a is equal to b');
                expectBinaryExpression(node, OperatorType.IsEqualTo);
            });

            test('should parse "is not equal to"', () => {
                const node = parseExpressionFromString('a is not equal to b');
                expectBinaryExpression(node, OperatorType.IsNotEqualTo);
            });

            test('should parse "is greater than"', () => {
                const node = parseExpressionFromString('a is greater than b');
                expectBinaryExpression(node, OperatorType.IsGreaterThan);
            });

            test('should parse "is greater than or equal to"', () => {
                const node = parseExpressionFromString('a is greater than or equal to b');
                expectBinaryExpression(node, OperatorType.IsGreaterThanOrEqual);
            });

            test('should parse "is less than"', () => {
                const node = parseExpressionFromString('a is less than b');
                expectBinaryExpression(node, OperatorType.IsLessThan);
            });

            test('should parse "is less than or equal to"', () => {
                const node = parseExpressionFromString('a is less than or equal to b');
                expectBinaryExpression(node, OperatorType.IsLessThanOrEqual);
            });

            test('should parse "is in"', () => {
                const node = parseExpressionFromString('item is in array');
                expectBinaryExpression(node, OperatorType.IsIn);
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

            test('should handle complex precedence', () => {
                const node = parseExpressionFromString('1 + 2 * 3 - 4 / 2');
                expectNodeType(node, NodeType.BinaryExpression);
                // Should parse as: ((1 + (2 * 3)) - (4 / 2))
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
    });

    describe('Unary Expressions', () => {
        test('should parse logical not with !', () => {
            const node = parseExpressionFromString('!true');
            expectNodeType(node, NodeType.UnaryExpression);
            const unaryNode = node as UnaryExpressionNode;
            expect(unaryNode.condition.type).toBe(NodeType.Literal);
        });

        test('should parse logical not with !', () => {
            const node = parseExpressionFromString('!false');
            expectNodeType(node, NodeType.UnaryExpression);
        });

        test('should parse unary minus', () => {
            const node = parseExpressionFromString('-42');
            expectNodeType(node, NodeType.UnaryExpression);
            const unaryNode = node as UnaryExpressionNode;
            expect(unaryNode.condition.type).toBe(NodeType.Literal);
        });

        test('should handle unary operator precedence', () => {
            const node = parseExpressionFromString('!a and b');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.UnaryExpression);
        });

        test('should handle multiple unary operators', () => {
            const node = parseExpressionFromString('!!true');
            expectNodeType(node, NodeType.UnaryExpression);
            const unaryNode = node as UnaryExpressionNode;
            expect(unaryNode.condition.type).toBe(NodeType.UnaryExpression);
        });

        test('should handle unary minus with expressions', () => {
            const node = parseExpressionFromString('-(1 + 2)');
            expectNodeType(node, NodeType.UnaryExpression);
            const unaryNode = node as UnaryExpressionNode;
            expect(unaryNode.condition.type).toBe(NodeType.BinaryExpression);
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
            expect(arrayNode.elements[0].type).toBe(NodeType.Literal);
        });

        test('should parse array with mixed types', () => {
            const node = parseExpressionFromString('[1, "hello", true, null]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(4);
        });

        test('should parse nested arrays', () => {
            const node = parseExpressionFromString('[[1, 2], [3, 4]]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(2);
            expect(arrayNode.elements[0].type).toBe(NodeType.ArrayExpression);
        });

        test('should parse array with expressions', () => {
            const node = parseExpressionFromString('[1 + 1, a * b]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(2);
            expect(arrayNode.elements[0].type).toBe(NodeType.BinaryExpression);
        });
    });

    describe('Object Expressions', () => {
        test('should parse empty object', () => {
            const node = parseExpressionFromString('{}');
            expectNodeType(node, NodeType.ObjectExpression);
            const objNode = node as ObjectExpressionNode;
            expect(objNode.properties).toHaveLength(0);
        });

        test('should parse object with properties', () => {
            const node = parseExpressionFromString('{name: "John", age: 20}');
            expectNodeType(node, NodeType.ObjectExpression);
            const objNode = node as ObjectExpressionNode;
            expect(objNode.properties).toHaveLength(2);
        });

        test('should parse object with string keys', () => {
            const node = parseExpressionFromString('{"key1": "value1", "key2": "value2"}');
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should parse object with computed properties', () => {
            const node = parseExpressionFromString('{[key]: value}');
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should parse nested objects', () => {
            const node = parseExpressionFromString('{user: {name: "John", age: 20}}');
            expectNodeType(node, NodeType.ObjectExpression);
            const objNode = node as ObjectExpressionNode;
            expect(objNode.properties).toHaveLength(1);
        });

        test('should handle trailing comma in object', () => {
            const node = parseExpressionFromString('{a: 1, b: 2,}');
            expectNodeType(node, NodeType.ObjectExpression);
        });
    });

    describe('Tuple Expressions', () => {
        test('should parse empty tuple', () => {
            const node = parseExpressionFromString('()');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(0);
        });

        test('should parse single element tuple with comma', () => {
            const node = parseExpressionFromString('(1,)');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(1);
        });

        test('should parse multi-element tuple', () => {
            const node = parseExpressionFromString('(1, 2, 3)');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(3);
        });

        test('should distinguish tuple from grouping', () => {
            const grouping = parseExpressionFromString('(1 + 2)');
            const tuple = parseExpressionFromString('(1,)');
            
            expect(grouping.type).toBe(NodeType.BinaryExpression);
            expect(tuple.type).toBe(NodeType.TupleExpression);
        });

        test('should parse nested tuples', () => {
            const node = parseExpressionFromString('((1, 2), (3, 4))');
            expectNodeType(node, NodeType.TupleExpression);
            const tupleNode = node as TupleExpressionNode;
            expect(tupleNode.elements).toHaveLength(2);
            expect(tupleNode.elements[0].type).toBe(NodeType.TupleExpression);
        });
    });

    describe('Rest Expressions', () => {
        test('should parse rest expression', () => {
            const node = parseExpressionFromString('...args');
            expectNodeType(node, NodeType.RestExpression);
            const restNode = node as RestExpressionNode;
            expect(restNode.value.type).toBe(NodeType.Identifier);
        });

        test('should parse rest with complex expression', () => {
            const node = parseExpressionFromString('...obj.property');
            expectNodeType(node, NodeType.RestExpression);
            const restNode = node as RestExpressionNode;
            expect(restNode.value.type).toBe(NodeType.MemberExpression);
        });

        test('should parse rest in array context', () => {
            const node = parseExpressionFromString('[1, 2, ...others]');
            expectNodeType(node, NodeType.ArrayExpression);
            const arrayNode = node as ArrayExpressionNode;
            expect(arrayNode.elements).toHaveLength(3);
            expect(arrayNode.elements[2].type).toBe(NodeType.RestExpression);
        });
    });

    describe('Member Expressions', () => {
        test('should parse property access', () => {
            const node = parseExpressionFromString('obj.prop');
            expectNodeType(node, NodeType.MemberExpression);
            const memberNode = node as MemberExpressionNode;
            expect(memberNode.target.type).toBe(NodeType.Identifier);
            expect(memberNode.property.type).toBe(NodeType.Identifier);
        });

        test('should parse chained property access', () => {
            const node = parseExpressionFromString('obj.prop.subProp');
            expectNodeType(node, NodeType.MemberExpression);
            const memberNode = node as MemberExpressionNode;
            expect(memberNode.target.type).toBe(NodeType.MemberExpression);
        });

        test('should parse computed property access', () => {
            const node = parseExpressionFromString('obj[key]');
            expectNodeType(node, NodeType.MemberExpression);
        });

        test('should parse complex member chains', () => {
            const node = parseExpressionFromString('obj.method().prop[0]');
            expectNodeType(node, NodeType.MemberExpression);
        });
    });

    describe('Call Expressions', () => {
        test('should parse function call with no arguments', () => {
            const node = parseExpressionFromString('func()');
            expectNodeType(node, NodeType.CallExpression);
            const callNode = node as CallExpressionNode;
            expect(callNode.callee.type).toBe(NodeType.Identifier);
            expect(callNode.args).toHaveLength(0);
        });

        test('should parse function call with arguments', () => {
            const node = parseExpressionFromString('func(1, 2, 3)');
            expectNodeType(node, NodeType.CallExpression);
            const callNode = node as CallExpressionNode;
            expect(callNode.args).toHaveLength(3);
        });

        test('should parse method call', () => {
            const node = parseExpressionFromString('obj.method(arg)');
            expectNodeType(node, NodeType.CallExpression);
            const callNode = node as CallExpressionNode;
            expect(callNode.callee.type).toBe(NodeType.MemberExpression);
        });

        test('should parse chained calls', () => {
            const node = parseExpressionFromString('obj.method1().method2()');
            expectNodeType(node, NodeType.CallExpression);
        });

        test('should parse nested calls', () => {
            const node = parseExpressionFromString('outer(inner(value))');
            expectNodeType(node, NodeType.CallExpression);
            const callNode = node as CallExpressionNode;
            expect(callNode.args).toHaveLength(1);
            expect(callNode.args[0].type).toBe(NodeType.CallExpression);
        });

        test('should handle trailing comma in arguments', () => {
            const node = parseExpressionFromString('func(a, b)');
            expectNodeType(node, NodeType.CallExpression);
            const callNode = node as CallExpressionNode;
            expect(callNode.args).toHaveLength(2);
        });
    });

    describe('Ternary Expressions', () => {
        test('should parse ternary conditional', () => {
            const node = parseExpressionFromString('a ? b : c');
            expectNodeType(node, NodeType.TernaryExpression);
            const ternaryNode = node as TernaryExpressionNode;
            expect(ternaryNode.condition.type).toBe(NodeType.Identifier);
            expect(ternaryNode.trueValue.type).toBe(NodeType.Identifier);
            expect(ternaryNode.falseValue.type).toBe(NodeType.Identifier);
        });

        test('should parse ternary with complex expressions', () => {
            const node = parseExpressionFromString('a > b ? x + 1 : y - 1');
            expectNodeType(node, NodeType.TernaryExpression);
            const ternaryNode = node as TernaryExpressionNode;
            expect(ternaryNode.condition.type).toBe(NodeType.BinaryExpression);
            expect(ternaryNode.trueValue.type).toBe(NodeType.BinaryExpression);
            expect(ternaryNode.falseValue.type).toBe(NodeType.BinaryExpression);
        });

        test('should parse nested ternary expressions', () => {
            const node = parseExpressionFromString('a ? b ? c : d : e');
            expectNodeType(node, NodeType.TernaryExpression);
            const ternaryNode = node as TernaryExpressionNode;
            expect(ternaryNode.trueValue.type).toBe(NodeType.TernaryExpression);
        });

        test('should handle ternary precedence', () => {
            const node = parseExpressionFromString('a + b ? c * d : e / f');
            expectNodeType(node, NodeType.TernaryExpression);
            const ternaryNode = node as TernaryExpressionNode;
            expect(ternaryNode.condition.type).toBe(NodeType.BinaryExpression);
        });
    });

    describe('Complex Expressions', () => {
        test('should parse complex nested expression', () => {
            const code = 'arr[index].method(arg1, arg2).prop + (x ? y : z)';
            const node = parseExpressionFromString(code);
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should parse spread in object', () => {
            const node = parseExpressionFromString('{...obj, newProp: value}');
            expectNodeType(node, NodeType.ObjectExpression);
        });

        test('should parse spread in array', () => {
            const node = parseExpressionFromString('[...arr1, ...arr2, newItem]');
            expectNodeType(node, NodeType.ArrayExpression);
        });

        test('should parse function expression', () => {
            const node = parseExpressionFromString('function(a, b) { return a + b }');
            expectNodeType(node, NodeType.FunctionExpression);
        });

        test('should parse lambda expression', () => {
            const node = parseExpressionFromString('(a, b) => a + b');
            expectNodeType(node, NodeType.FunctionExpression);
        });

        test('should handle deeply nested structures', () => {
            const code = `{
                users: [
                    {
                        name: "John",
                        // scores: [1, 2, 3].map(x => x * 2),
                        // active: true
                    }
                ],
                //count: users.length
            }`;
            const node = parseExpressionFromString(code);
            expectNodeType(node, NodeType.ObjectExpression);
        });
    });

    describe('String Interpolation', () => {
        test('should parse string with single interpolation', () => {
            const node = parseExpressionFromString('"Hello {name}!"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toHaveLength(3);
            expect(stringNode.value[0]).toBe('Hello ');
            expect(stringNode.value[2]).toBe('!');
        });

        test('should parse string with multiple interpolations', () => {
            const node = parseExpressionFromString('"User {name} has {count} items"');
            expectNodeType(node, NodeType.StringExpression);
            const stringNode = node as StringExpressionNode;
            expect(stringNode.value).toHaveLength(5);
        });

        test('should parse string with complex interpolation', () => {
            const node = parseExpressionFromString('"Result: {a + b * c}"');
            expectNodeType(node, NodeType.StringExpression);
        });

        test('should parse string with nested interpolation', () => {
            const node = parseExpressionFromString('"Outer {inner + "nested {value}"} end"');
            expectNodeType(node, NodeType.StringExpression);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle empty expression', () => {
            expectParseError('');
        });

        test('should handle incomplete binary expression', () => {
            expectParseError('1 +');
        });

        test('should handle incomplete ternary expression', () => {
            expectParseError('a ?');
            expectParseError('a ? b');
            expectParseError('a ? b :');
        });

        test('should handle unclosed array', () => {
            expectParseError('[1, 2, 3');
        });

        test('should handle unclosed object', () => {
            expectParseError('{name: "John"');
        });

        test('should handle unclosed tuple', () => {
            expectParseError('(1, 2, 3');
        });

        test('should handle unclosed string', () => {
            expectParseError('"unclosed string');
        });

        test('should handle invalid object property', () => {
            expectParseError('{123invalid: value}');
        });

        test('should handle invalid function call', () => {
            expectParseError('func(,)');
            expectParseError('func(a,,b)');
        });

        test('should handle mismatched brackets', () => {
            expectParseError('[}');
            expectParseError('{]');
            expectParseError('(}');
        });

        test('should handle deeply nested expressions (max depth)', () => {
            const deepNesting = '('.repeat(300) + '1' + ')'.repeat(300);
            expectParseErrorType(deepNesting, ParserError);
        });

        test('should handle invalid unary operators', () => {
            expectParseError('+true'); // unary plus not supported
        });

        test('should handle invalid member access', () => {
            expectParseError('obj.');
            expectParseError('obj..prop');
        });

        test('should handle invalid rest operator', () => {
            expectParseError('...');
            expectParseError('...'); 
        });
    });

    describe('Specific NLang Features', () => {
        test('should parse semantic comparison operators', () => {
            const tests = [
                'num is greater than 5',
                'score is less than or equal to 100',
                'item is in array',
                'value is not null'
            ];
            
            tests.forEach(test => {
                const node = parseExpressionFromString(test);
                expectNodeType(node, NodeType.BinaryExpression);
            });
        });

        test('should handle identifier mode patterns', () => {
            // These would be tested in identifier mode
            const patterns = [
                '[a, b, c]',     // array pattern
                '{x, y}',        // object pattern  
                '(a, b)',        // tuple pattern
                '...rest'        // rest pattern
            ];
            
            patterns.forEach(pattern => {
                const node = parseExpressionFromString(pattern);
                expect(node).toBeDefined();
            });
        });

        test('should parse rich string expressions with tags', () => {
            // This would involve RawStringTag parsing
            const node = parseExpressionFromString('"<b>Bold</b> text"');
            expectNodeType(node, NodeType.StringExpression);
        });
    });

    describe('Performance and Limits', () => {
        test('should handle reasonable expression complexity', () => {
            const complexExpr = Array(50).fill(0).map((_, i) => `var${i}`).join(' + ');
            const node = parseExpressionFromString(complexExpr);
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('should handle large arrays', () => {
            const largeArray = '[' + Array(1000).fill(0).map((_, i) => i.toString()).join(', ') + ']';
            const node = parseExpressionFromString(largeArray);
            expectNodeType(node, NodeType.ArrayExpression);
        });

        test('should handle large objects', () => {
            const largeObject = '{' + Array(100).fill(0).map((_, i) => `prop${i}: ${i}`).join(', ') + '}';
            const node = parseExpressionFromString(largeObject);
            expectNodeType(node, NodeType.ObjectExpression);
        });
    });
});
