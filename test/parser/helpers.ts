// Test helpers for parser testing
import { lexer } from "../../src/index";
import { createParserIterator, filterComment } from "../../src/core/parser/ParserIterator";
import { parseExpression } from "../../src/core/parser/expression/ParseExpression";
import { LexerError } from "../../src/core/lexer/LexerError";
import { ExpressionNode, NodeType } from "../../src/core/parser/Node";
import { BinaryExpressionNode, IdentifierNode, LiteralNode } from "../../src/core/parser/expression/Expression";
import { OperatorType } from "../../src/core/lexer/Operator";
import { ParserError } from "../../src/core/parser/ParserError";

/**
 * Parse a string expression and return the AST node
 */
export function parseExpressionFromString(code: string): ExpressionNode {
  const tokens = lexer(code);
  
  if (LexerError.isLexerError(tokens)) {
    throw new Error(`Lexer error: ${tokens.message}`);
  }
  
  const { tokens: filteredTokens } = filterComment(tokens);
  const iterator = createParserIterator(filteredTokens);
  
  const result = parseExpression(iterator);
  if (!result) {
    throw new Error("Failed to parse expression");
  }
  
  return result;
}

/**
 * Parse a string expression and expect it to throw an error
 */
export function expectParseError(code: string): void {
  expect(() => parseExpressionFromString(code)).toThrow();
}

/**
 * Parse a string expression and expect a specific error type
 */
export function expectParseErrorType(code: string, errorType: typeof ParserError): void {
  expect(() => parseExpressionFromString(code)).toThrow(errorType);
}

/**
 * Create a mock identifier node
 */
export function createIdentifier(name: string, start: number = 0, end: number = name.length): IdentifierNode {
  return {
    type: NodeType.Identifier,
    trace: { start, end },
    name,
  };
}

/**
 * Create a mock literal node
 */
export function createLiteral(value: number | boolean | null, start: number = 0, end: number = 1): LiteralNode {
  return {
    type: NodeType.Literal,
    trace: { start, end },
    value,
  };
}

/**
 * Create a mock binary expression node
 */
export function createBinaryExpression(
  operator: OperatorType,
  left: ExpressionNode,
  right: ExpressionNode,
  start: number = 0,
  end: number = 1
): BinaryExpressionNode {
  return {
    type: NodeType.BinaryExpression,
    trace: { start, end },
    operator: operator as any,
    left,
    right,
  };
}

/**
 * Test helper to verify node structure
 */
export function expectNodeType(node: ExpressionNode, type: NodeType): void {
  expect(node.type).toBe(type);
}

/**
 * Test helper to verify binary expression structure
 */
export function expectBinaryExpression(
  node: ExpressionNode,
  operator: OperatorType,
  leftCheck?: (node: ExpressionNode) => void,
  rightCheck?: (node: ExpressionNode) => void
): void {
  expect(node.type).toBe(NodeType.BinaryExpression);
  const binaryNode = node as BinaryExpressionNode;
  expect(binaryNode.operator).toBe(operator);
  
  if (leftCheck) leftCheck(binaryNode.left);
  if (rightCheck) rightCheck(binaryNode.right);
}

/**
 * Test helper to verify identifier
 */
export function expectIdentifier(node: ExpressionNode, name: string): void {
  expect(node.type).toBe(NodeType.Identifier);
  const identifierNode = node as IdentifierNode;
  expect(identifierNode.name).toBe(name);
}

/**
 * Test helper to verify literal
 */
export function expectLiteral(node: ExpressionNode, value: number | boolean | null): void {
  expect(node.type).toBe(NodeType.Literal);
  const literalNode = node as LiteralNode;
  expect(literalNode.value).toBe(value);
}

/**
 * Generate test cases for operator precedence
 */
export interface OperatorTestCase {
  code: string;
  description: string;
  expectedStructure: string; // Human-readable description of expected AST structure
}

export function generatePrecedenceTestCases(): OperatorTestCase[] {
  return [
    {
      code: "a + b * c",
      description: "Multiplication has higher precedence than addition",
      expectedStructure: "a + (b * c)"
    },
    {
      code: "a * b + c",
      description: "Left-to-right evaluation with same precedence",
      expectedStructure: "(a * b) + c"
    },
    {
      code: "a ** b ** c",
      description: "Exponentiation is right-associative",
      expectedStructure: "a ** (b ** c)"
    },
    {
      code: "a + b - c",
      description: "Addition and subtraction are left-associative",
      expectedStructure: "(a + b) - c"
    },
    {
      code: "a and b or c",
      description: "AND has higher precedence than OR",
      expectedStructure: "(a and b) or c"
    },
    {
      code: "a = b and c",
      description: "Logical operators have higher precedence than comparison",
      expectedStructure: "a = (b and c)"
    },
    {
      code: "a > b and c < d",
      description: "Comparison operators group with AND",
      expectedStructure: "(a > b) and (c < d)"
    },
    {
      code: "a + b > c * d",
      description: "Arithmetic before comparison",
      expectedStructure: "(a + b) > (c * d)"
    }
  ];
}

/**
 * Test case generator for NarraLang semantic operators
 */
export function generateSemanticOperatorTestCases(): OperatorTestCase[] {
  return [
    {
      code: "a is equal to b",
      description: "Semantic equality operator",
      expectedStructure: "a is_equal_to b"
    },
    {
      code: "a is not equal to b",
      description: "Semantic inequality operator",
      expectedStructure: "a is_not_equal_to b"
    },
    {
      code: "a is greater than b",
      description: "Semantic greater than operator",
      expectedStructure: "a is_greater_than b"
    },
    {
      code: "a is less than or equal to b",
      description: "Semantic less than or equal operator",
      expectedStructure: "a is_less_than_or_equal_to b"
    },
    {
      code: "a is in b",
      description: "Semantic membership operator",
      expectedStructure: "a is_in b"
    },
    {
      code: "a is not b",
      description: "Semantic negation operator",
      expectedStructure: "a is_not b"
    }
  ];
}

/**
 * Edge case test generator
 */
export function generateEdgeCaseTests(): Array<{ code: string; shouldError: boolean; description: string }> {
  return [
    {
      code: "",
      shouldError: true,
      description: "Empty expression should error"
    },
    {
      code: "+",
      shouldError: true,
      description: "Operator without operands should error"
    },
    {
      code: "a +",
      shouldError: true,
      description: "Missing right operand should error"
    },
    {
      code: "+ a",
      shouldError: true,
      description: "Prefix operator without support should error"
    },
    {
      code: "a + + b",
      shouldError: true,
      description: "Double operators should error"
    },
    {
      code: "a ? b",
      shouldError: true,
      description: "Incomplete ternary expression should error"
    },
    {
      code: "a ? b :",
      shouldError: true,
      description: "Ternary without false value should error"
    },
    {
      code: "a.",
      shouldError: true,
      description: "Member access without property should error"
    },
    {
      code: "a(",
      shouldError: true,
      description: "Unclosed function call should error"
    }
  ];
}
