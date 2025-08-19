/**
 * 表达式优先级和结合性测试
 * Expression Precedence and Associativity Tests
 * 
 * 专门测试运算符优先级、结合性和复杂表达式解析
 */

import { 
    parseExpressionFromString,
    expectNodeType,
    expectBinaryExpression,
    generatePrecedenceTestCases,
    generateSemanticOperatorTestCases,
    generateEdgeCaseTests,
    OperatorTestCase
} from './helpers';

import { NodeType } from '../../src/core/parser/Node';
import { OperatorType } from '../../src/core/lexer/Operator';
import { BinaryExpressionNode, UnaryExpressionNode } from '../../src/core/parser/expression/Expression';

describe('Expression Precedence and Associativity', () => {
    
    describe('Arithmetic Operator Precedence', () => {
        test('addition and multiplication precedence', () => {
            const node = parseExpressionFromString('1 + 2 * 3');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: 1 + (2 * 3)
            expect(binNode.operator).toBe(OperatorType.Plus);
            expect(binNode.left.type).toBe(NodeType.Literal);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
            
            const rightNode = binNode.right as BinaryExpressionNode;
            expect(rightNode.operator).toBe(OperatorType.Asterisk);
        });

        test('multiplication and division same precedence', () => {
            const node = parseExpressionFromString('6 / 2 * 3');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (6 / 2) * 3 (left associative)
            expect(binNode.operator).toBe(OperatorType.Asterisk);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.Literal);
            
            const leftNode = binNode.left as BinaryExpressionNode;
            expect(leftNode.operator).toBe(OperatorType.Slash);
        });

        test('exponentiation right associativity', () => {
            const node = parseExpressionFromString('2 ** 3 ** 2');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: 2 ** (3 ** 2) (right associative)
            expect(binNode.operator).toBe(OperatorType.Exponent);
            expect(binNode.left.type).toBe(NodeType.Literal);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
            
            const rightNode = binNode.right as BinaryExpressionNode;
            expect(rightNode.operator).toBe(OperatorType.Exponent);
        });

        test('complex arithmetic precedence', () => {
            const node = parseExpressionFromString('1 + 2 * 3 ** 2 - 4 / 2');
            expectNodeType(node, NodeType.BinaryExpression);
            
            // Should parse as: ((1 + (2 * (3 ** 2))) - (4 / 2))
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Minus);
        });
    });

    describe('Logical Operator Precedence', () => {
        test('logical not has highest precedence', () => {
            const node = parseExpressionFromString('!a and b');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (!a) and b
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.UnaryExpression);
            expect(binNode.right.type).toBe(NodeType.Identifier);
        });

        test('and has higher precedence than or', () => {
            const node = parseExpressionFromString('a or b and c');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: a or (b and c)
            expect(binNode.operator).toBe(OperatorType.Or);
            expect(binNode.left.type).toBe(NodeType.Identifier);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
            
            const rightNode = binNode.right as BinaryExpressionNode;
            expect(rightNode.operator).toBe(OperatorType.And);
        });

        test('comparison operators and logical operators', () => {
            const node = parseExpressionFromString('a > b and c < d');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (a > b) and (c < d)
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('nullish coalescing precedence', () => {
            const node = parseExpressionFromString('a and b ?? c');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (a and b) ?? c
            expect(binNode.operator).toBe(OperatorType.Nullish);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
        });

        test('nullish coalescing precedence with parentheses', () => {
            const node = parseExpressionFromString('(a and b) ?? c');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (a and b) ?? c
            expect(binNode.operator).toBe(OperatorType.Nullish);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
        });
    });

    describe('Mixed Precedence Scenarios', () => {
        test('arithmetic and comparison', () => {
            const node = parseExpressionFromString('a + b > c * d');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (a + b) > (c * d)
            expect(binNode.operator).toBe(OperatorType.LogicalGreaterThan);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('unary and binary operators', () => {
            const node = parseExpressionFromString('-a + b * !c');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (-a) + (b * (!c))
            expect(binNode.operator).toBe(OperatorType.Plus);
            expect(binNode.left.type).toBe(NodeType.UnaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('ternary has lowest precedence', () => {
            const node = parseExpressionFromString('a + b ? c * d : e - f');
            expectNodeType(node, NodeType.TernaryExpression);
            
            // Condition should be the entire left expression: a + b
            // True/false values should be complete expressions: c * d, e - f
        });
    });

    describe('Parentheses Override', () => {
        test('parentheses change addition/multiplication precedence', () => {
            const node = parseExpressionFromString('(1 + 2) * 3');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (1 + 2) * 3
            expect(binNode.operator).toBe(OperatorType.Asterisk);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.Literal);
        });

        test('nested parentheses', () => {
            const node = parseExpressionFromString('((1 + 2) * 3) + 4');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            expect(binNode.operator).toBe(OperatorType.Plus);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
        });

        test('parentheses with logical operators', () => {
            const node = parseExpressionFromString('a and (b or c)');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: a and (b or c)
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
            
            const rightNode = binNode.right as BinaryExpressionNode;
            expect(rightNode.operator).toBe(OperatorType.Or);
        });
    });

    describe('Semantic Operator Precedence', () => {
        test('semantic comparison operators', () => {
            const node = parseExpressionFromString('x is greater than y and z is less than w');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (x is greater than y) and (z is less than w)
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('is in operator precedence', () => {
            const node = parseExpressionFromString('item is in array and found');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            // Should parse as: (item is in array) and found
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
        });

        test('mixed semantic and symbol operators', () => {
            const node = parseExpressionFromString('a > b and c is not equal to d');
            expectNodeType(node, NodeType.BinaryExpression);
            const binNode = node as BinaryExpressionNode;
            
            expect(binNode.operator).toBe(OperatorType.And);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });
    });

    describe('Complex Precedence Chains', () => {
        test('long arithmetic chain', () => {
            const node = parseExpressionFromString('1 + 2 * 3 ** 4 - 5 / 6 % 7');
            expectNodeType(node, NodeType.BinaryExpression);
            
            // Should respect all operator precedences correctly
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Minus);
        });

        test('mixed logical and comparison chain', () => {
            const node = parseExpressionFromString('a > b and c <= d or e != f and g = h');
            expectNodeType(node, NodeType.BinaryExpression);
            
            // Should handle complex logical operator precedence
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Or);
        });

        test('ternary in complex expression', () => {
            const node = parseExpressionFromString('a + b > c ? d * e : f - g and h');
            expectNodeType(node, NodeType.TernaryExpression);
            
            // Ternary should have lowest precedence
        });
    });

    describe('Generated Test Cases', () => {
        describe('Precedence Test Cases', () => {
            const testCases = generatePrecedenceTestCases();
            
            testCases.forEach((testCase: OperatorTestCase) => {
                test(testCase.description, () => {
                    const node = parseExpressionFromString(testCase.code);
                    expect(node).toBeDefined();
                    expect(node.type).toBe(NodeType.BinaryExpression);
                    
                    // Additional verification based on expected structure
                    // This would be expanded based on the specific test case
                });
            });
        });

        describe('Semantic Operator Test Cases', () => {
            const testCases = generateSemanticOperatorTestCases();
            
            testCases.forEach((testCase: OperatorTestCase) => {
                test(testCase.description, () => {
                    const node = parseExpressionFromString(testCase.code);
                    expect(node).toBeDefined();
                    
                    // Verify that semantic operators are parsed correctly
                    if (node.type === NodeType.BinaryExpression) {
                        const binNode = node as BinaryExpressionNode;
                        expect(Object.values(OperatorType)).toContain(binNode.operator);
                    }
                });
            });
        });
    });

    describe('Edge Cases with Precedence', () => {
        const edgeCases = generateEdgeCaseTests();
        
        edgeCases.forEach((testCase) => {
            test(testCase.description, () => {
                if (testCase.shouldError) {
                    expect(() => parseExpressionFromString(testCase.code)).toThrow();
                } else {
                    const node = parseExpressionFromString(testCase.code);
                    expect(node).toBeDefined();
                }
            });
        });
    });

    describe('Associativity Edge Cases', () => {
        test('multiple exponentiation operations', () => {
            const node = parseExpressionFromString('2 ** 3 ** 4 ** 2');
            expectNodeType(node, NodeType.BinaryExpression);
            
            // Should be right-associative: 2 ** (3 ** (4 ** 2))
            let current = node as BinaryExpressionNode;
            expect(current.operator).toBe(OperatorType.Exponent);
            expect(current.right.type).toBe(NodeType.BinaryExpression);
        });

        test('mixed associativity', () => {
            const node = parseExpressionFromString('2 ** 3 * 4 ** 5');
            expectNodeType(node, NodeType.BinaryExpression);
            
            // Should parse as: (2 ** 3) * (4 ** 5)
            const binNode = node as BinaryExpressionNode;
            expect(binNode.operator).toBe(OperatorType.Asterisk);
            expect(binNode.left.type).toBe(NodeType.BinaryExpression);
            expect(binNode.right.type).toBe(NodeType.BinaryExpression);
        });

        test('assignment-like operations (if supported)', () => {
            // This would test if assignment operators were supported
            // Currently NLang doesn't seem to have assignment expressions
        });
    });

    describe('Performance with Complex Precedence', () => {
        test('deeply nested precedence', () => {
            const expr = Array(50).fill(0).map((_, i) => `a${i} + b${i} * c${i}`).join(' + ');
            const node = parseExpressionFromString(expr);
            expectNodeType(node, NodeType.BinaryExpression);
        });

        test('alternating high and low precedence', () => {
            const expr = Array(20).fill(0).map((_, i) => i % 2 === 0 ? 'a * b' : 'c + d').join(' and ');
            const node = parseExpressionFromString(expr);
            expectNodeType(node, NodeType.BinaryExpression);
        });
    });
});
