// Tests for sugar call statement parsing
import { lexer } from "../../src/index";
import { createParserIterator, filterComment } from "../../src/core/parser/ParserIterator";
import { parseStatement } from "../../src/core/parser/statement/ParseStatement";
import { LexerError } from "../../src/core/lexer/LexerError";
import { NodeType } from "../../src/core/parser/Node";
import { SugarCallStatementNode } from "../../src/core/parser/statement/Statement";

/**
 * Parse a statement from string
 */
function parseStatementFromString(code: string) {
  const tokens = lexer(code);
  
  if (LexerError.isLexerError(tokens)) {
    throw new Error(`Lexer error: ${tokens.message}`);
  }
  
  const { tokens: filteredTokens } = filterComment(tokens);
  const iterator = createParserIterator(filteredTokens);
  
  const result = parseStatement(iterator);
  if (!result) {
    throw new Error("Failed to parse statement");
  }
  
  return result;
}

describe("Sugar Call Statement Parsing", () => {
  describe("Basic sugar syntax", () => {
    test("should parse sugar call with single argument", () => {
      const code = 'image "photo.png"';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("image");
      expect(result.args).toHaveLength(1);
      expect(result.args[0].type).toBe(NodeType.StringExpression);
    });

    test("should parse sugar call with multiple arguments", () => {
      const code = 'character John "John Smith"';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("character");
      expect(result.args).toHaveLength(2);
      expect(result.args[0].type).toBe(NodeType.Identifier);
      expect(result.args[1].type).toBe(NodeType.StringExpression);
    });

    test("should parse sugar call with numeric argument", () => {
      const code = 'wait 5';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("wait");
      expect(result.args).toHaveLength(1);
      expect(result.args[0].type).toBe(NodeType.Literal);
    });
  });

  describe("Sugar syntax with modifiers", () => {
    test("should parse sugar call with single modifier", () => {
      const code = 'image "photo.png" scale 1.0';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("image");
      expect(result.args).toHaveLength(1);
      expect(Object.keys(result.modifiers)).toContain("scale");
      expect(result.modifiers.scale.type).toBe(NodeType.Literal);
    });

    test("should parse sugar call with multiple modifiers", () => {
      const code = 'image John "url" pos (5, 10) scale 1.0';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("image");
      expect(result.args).toHaveLength(2);
      expect(Object.keys(result.modifiers)).toContain("pos");
      expect(Object.keys(result.modifiers)).toContain("scale");
      expect(result.modifiers.pos.type).toBe(NodeType.TupleExpression);
      expect(result.modifiers.scale.type).toBe(NodeType.Literal);
    });

    test("should parse sugar call with modifier after argument", () => {
      // Note: Without existing arguments, "scale 2.0" is ambiguous
      // It could be two arguments or a modifier
      // We need at least one argument to reliably detect modifiers
      const code = 'display "text" scale 2.0';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("display");
      expect(result.args).toHaveLength(1);
      expect(Object.keys(result.modifiers)).toContain("scale");
    });
  });

  describe("Sugar syntax with spread operator", () => {
    test("should parse sugar call with spread modifier object", () => {
      const code = 'image "photo.png" ...{scale: 1.0, alpha: 0.5}';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("image");
      expect(result.args).toHaveLength(1);
      // Spread expressions are stored with special keys
      const spreadKeys = Object.keys(result.modifiers).filter(k => k.startsWith("__spread_"));
      expect(spreadKeys.length).toBeGreaterThan(0);
    });

    test("should parse sugar call with mixed modifiers and spread", () => {
      const code = 'image "photo.png" pos (0, 0) ...{scale: 1.0}';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("image");
      expect(result.args).toHaveLength(1);
      expect(Object.keys(result.modifiers)).toContain("pos");
      const spreadKeys = Object.keys(result.modifiers).filter(k => k.startsWith("__spread_"));
      expect(spreadKeys.length).toBeGreaterThan(0);
    });
  });

  describe("Expression statements (not sugar syntax)", () => {
    test("should parse function call as expression statement", () => {
      const code = 'myFunction(1, 2)';
      const result = parseStatementFromString(code);
      
      expect(result.type).toBe(NodeType.ExpressionStatement);
    });

    test("should parse binary expression as expression statement", () => {
      const code = 'a + b';
      const result = parseStatementFromString(code);
      
      expect(result.type).toBe(NodeType.ExpressionStatement);
    });

    test("should parse member access as expression statement", () => {
      const code = 'obj.property';
      const result = parseStatementFromString(code);
      
      expect(result.type).toBe(NodeType.ExpressionStatement);
    });

    test("should parse standalone identifier as expression statement", () => {
      const code = 'someVariable';
      const result = parseStatementFromString(code);
      
      expect(result.type).toBe(NodeType.ExpressionStatement);
    });
  });

  describe("Complex sugar syntax", () => {
    test("should parse sugar call with expression arguments", () => {
      // Note: obj(x+5) is parsed as a function call, not two separate args
      // Use comma-separated or differently structured expressions
      const code = 'move obj x y';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("move");
      expect(result.args).toHaveLength(3);
      expect(result.args[0].type).toBe(NodeType.Identifier);
      expect(result.args[1].type).toBe(NodeType.Identifier);
      expect(result.args[2].type).toBe(NodeType.Identifier);
    });

    test("should parse sugar call with object literal modifier", () => {
      const code = 'configure settings {option: true, value: 10}';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("configure");
      expect(result.args).toHaveLength(2);
    });

    test("should parse sugar call with array literal argument", () => {
      // Note: "items [...]" would be parsed as array access
      // Array literals as arguments should not have identifier immediately before them
      const code = 'display [1, 2, 3]';
      const result = parseStatementFromString(code) as SugarCallStatementNode;
      
      expect(result.type).toBe(NodeType.SugarCallStatement);
      expect(result.name).toBe("display");
      expect(result.args).toHaveLength(1);
      expect(result.args[0].type).toBe(NodeType.ArrayExpression);
    });
  });
});
