import { lexer, parse, ParserError } from "../../../src";
import fs from "fs";
import { LexerError } from "../../../src/core/lexer/LexerError";
import path from "path";
import { toErrorMessage } from "../../../src/core/lexer/Lexer";

describe('NLS Script Parser Tests', () => {
    const testFiles = [
        './01-basic-syntax.nls',
        './02-functions.nls',
        './03-control-flow.nls',
        './04-collections.nls',
        './05-strings.nls',
        './06-advanced-features.nls',
        './07-scenes-dialogues.nls',
        './08-edge-cases.nls',
    ];

    testFiles.forEach(file => {
        test(`should parse ${file} without errors`, () => {
            const content = fs.readFileSync(path.join(__dirname, file), "utf8");
            
            // Test lexing
            const tokens = lexer(content);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error in ${file}: ${toErrorMessage(tokens, content)}`);
            }

            // Test parsing with enhanced error reporting
            try {
                const parseResult = parse(tokens, {
                    sourceText: content,
                    enhancedErrors: true
                });
                // If we get here, parsing succeeded
                expect(parseResult.nodes).toBeDefined();
            } catch (error) {
                if (ParserError.isParserError(error)) {
                    // Create enhanced error message with line information
                    const enhancedError = error.toError(content);
                    throw new Error(`Parser error in ${file}:\n${enhancedError.message}\n${enhancedError.stack?.split('\n').slice(1).join('\n') || ''}`);
                } else if (error instanceof Error) {
                    // Already enhanced error or other error type
                    throw new Error(`Parser error in ${file}:\n${error.message}\n${error.stack?.split('\n').slice(1).join('\n') || ''}`);
                } else {
                    throw new Error(`Unknown parser error in ${file}: ${String(error)}`);
                }
            }
        });
    });
});
