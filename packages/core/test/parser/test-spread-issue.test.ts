import { parseExpressionFromString } from "./helpers";

describe("Unary Prefix Operator Validation Test", () => {
    test("a...b should throw error - spread operator must be prefix only", () => {
        // This test case verifies that a...b throws an error
        // because ... is a unary prefix operator, not an infix operator
        expect(() => {
            parseExpressionFromString("a...b");
        }).toThrow(/Unary prefix operator '...' cannot be used as infix operator/);
    });

    test("a!b should throw error - logical not operator must be prefix only", () => {
        // This test case verifies that a!b throws an error
        // because ! is a unary prefix operator, not an infix operator
        expect(() => {
            parseExpressionFromString("a!b");
        }).toThrow(/Unary prefix operator '!' cannot be used as infix operator/);
    });

    test("...a should parse correctly as spread expression", () => {
        // This should work fine as ... is used as a prefix operator
        const result = parseExpressionFromString("...a");
        expect(result).toBeDefined();
        expect(result?.type).toBe("RestExpression");
    });

    test("!a should parse correctly as logical not expression", () => {
        // This should work fine as ! is used as a prefix operator
        const result = parseExpressionFromString("!a");
        expect(result).toBeDefined();
        expect(result?.type).toBe("UnaryExpression");
    });

    test("a + ...b should parse correctly", () => {
        // This should work as ... is used in correct prefix position
        const result = parseExpressionFromString("a + ...b");
        expect(result).toBeDefined();
        expect(result?.type).toBe("BinaryExpression");
    });

    test("a + !b should parse correctly", () => {
        // This should work as ! is used in correct prefix position
        const result = parseExpressionFromString("a + !b");
        expect(result).toBeDefined();
        expect(result?.type).toBe("BinaryExpression");
    });
});
