import { createLexerIterator } from "../../src/core/lexer/LexerIterator";
import { isDialogue } from "../../src/core/lexer/Dialogue";

describe("Multi-line Dialogue Validation", () => {
    describe("Valid Multi-line Dialogues", () => {
        test("should accept clean multi-line dialogue", () => {
            const input = `character: {
"hello world"
"another line"
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(true);
        });

        test("should accept multi-line dialogue with whitespace", () => {
            const input = `character: {
    "hello world"    
    "another line"    
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(true);
        });

        test("should accept single line dialogue", () => {
            const input = `character: "hello world"`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(true);
        });
    });

    describe("Invalid Multi-line Dialogues", () => {
        test("should reject multi-line dialogue with comma after quote", () => {
            const input = `character: {
"hello world",
"another line"
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(false);
        });

        test("should reject multi-line dialogue with semicolon after quote", () => {
            const input = `character: {
"hello world";
"another line"
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(false);
        });

        test("should reject multi-line dialogue with extra text after quote", () => {
            const input = `character: {
"hello world" extra
"another line"
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(false);
        });

        test("should reject multi-line dialogue with parentheses after quote", () => {
            const input = `character: {
"hello world"()
"another line"
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(false);
        });

        test("should reject multi-line dialogue with dot notation after quote", () => {
            const input = `character: {
"hello world".length
"another line"
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        test("should handle empty multi-line dialogue", () => {
            const input = `character: {
}`;
            const iterator = createLexerIterator(input);
            expect(isDialogue(iterator)).toBe(true);
        });

        test("should handle multi-line dialogue with various whitespace", () => {
            const input = `character: {\r\n"line one"\r\n"line two"\r\n}`;
            const iterator = createLexerIterator(input);
            const result = isDialogue(iterator);
            console.log("Input:", JSON.stringify(input));
            console.log("Result:", result);
            expect(result).toBe(true);
        });
    });
});
