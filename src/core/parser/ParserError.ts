import { Tokens } from "../lexer/TokenType";


export enum ParserErrorType {
    ExpectedVariableDeclaration = "ExpectedVariableDeclaration",
    ExpectedIdentifier = "ExpectedIdentifier",
    ExpectedKeyword = "ExpectedKeyword",
    ExpectedToken = "ExpectedToken",
    ExpectedStatement = "ExpectedStatement",

    UnexpectedToken = "UnexpectedToken",
    ExpectedExpression = "ExpectedExpression",
    InvalidVariableDeclaration = "InvalidVariableDeclaration",
    InvalidContext = "InvalidContext",
    UnknownError = "UnknownError",
}

export class ParserError extends Error {
    public type: ParserErrorType;
    /**
     * An ParserError without a position means that the error is at the end of the file.
     */
    public pos: { start: number; end: number } | null;

    public static isParserError(error: unknown): error is ParserError {
        return error instanceof ParserError;
    }

    constructor(type: ParserErrorType, message: string, pos?: Tokens | { start: number; end: number } | null) {
        super(message);

        this.name = "ParserError";
        this.type = type;
        this.pos = pos ? { start: pos.start, end: pos.end } : null;
    }

    public setPos(pos?: Tokens | { start: number; end: number } | null): this {
        if (pos) {
            this.pos = { start: pos.start, end: pos.end };
        }

        return this;
    }

    /**
     * Split text by line endings, handling \r, \r\n, and \n
     * @param text The text to split
     * @returns Array of lines without line endings
     */
    private splitLines(text: string): string[] {
        // Normalize line endings to \n first, then split
        return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    }

    /**
     * Calculate the visual width of a string, treating full-width characters as 2 units
     * @param str The string to calculate width for
     * @returns Visual width in character units
     */
    private getVisualWidth(str: string): number {
        let width = 0;
        for (const char of str) {
            // Check if character is full-width (CJK, emoji, etc.)
            const code = char.charCodeAt(0);
            if (
                // Full-width characters: U+FF01-FF5E, U+FFE0-FFE6
                (code >= 0xFF01 && code <= 0xFF5E) ||
                (code >= 0xFFE0 && code <= 0xFFE6) ||
                // CJK Unified Ideographs
                (code >= 0x4E00 && code <= 0x9FFF) ||
                // CJK Compatibility Ideographs
                (code >= 0xF900 && code <= 0xFAFF) ||
                // CJK Unified Ideographs Extension A
                (code >= 0x3400 && code <= 0x4DBF) ||
                // CJK Unified Ideographs Extension B
                (code >= 0x20000 && code <= 0x2A6DF) ||
                // CJK Unified Ideographs Extension C
                (code >= 0x2A700 && code <= 0x2B73F) ||
                // CJK Unified Ideographs Extension D
                (code >= 0x2B740 && code <= 0x2B81F) ||
                // CJK Unified Ideographs Extension E
                (code >= 0x2B820 && code <= 0x2CEAF) ||
                // CJK Unified Ideographs Extension F
                (code >= 0x2CEB0 && code <= 0x2EBEF) ||
                // CJK Unified Ideographs Extension G
                (code >= 0x30000 && code <= 0x3134F) ||
                // Hiragana
                (code >= 0x3040 && code <= 0x309F) ||
                // Katakana
                (code >= 0x30A0 && code <= 0x30FF) ||
                // Hangul Syllables
                (code >= 0xAC00 && code <= 0xD7AF) ||
                // Emoji and other full-width symbols
                (code >= 0x1F000 && code <= 0x1FFFF) ||
                // Zero-width characters should be 0 width
                (code >= 0x200B && code <= 0x200D) ||
                code === 0xFEFF ||
                code === 0x2060
            ) {
                if (code >= 0x200B && code <= 0x200D || code === 0xFEFF || code === 0x2060) {
                    // Zero-width characters
                    width += 0;
                } else {
                    // Full-width characters
                    width += 2;
                }
            } else {
                // Half-width characters
                width += 1;
            }
        }
        return width;
    }

    /**
     * Get the line number (1-based) where the error occurred
     * @param raw The raw source text
     * @returns Line number (1-based)
     */
    public getLine(raw: string): number {
        if (!this.pos) {
            // If no position, error is at end of file
            return this.splitLines(raw).length;
        }
        const lines = this.splitLines(raw.slice(0, this.pos.start));
        return lines.length;
    }

    /**
     * Get the visual column offset within the current line (0-based)
     * @param raw The raw source text
     * @returns Visual column offset (0-based)
     */
    public getInlineOffset(raw: string): number {
        if (!this.pos) {
            // If no position, error is at end of file
            const lines = this.splitLines(raw);
            const lastLine = lines[lines.length - 1] ?? "";
            return this.getVisualWidth(lastLine);
        }
        const lines = this.splitLines(raw.slice(0, this.pos.start));
        const currentLine = lines[lines.length - 1] ?? "";
        return this.getVisualWidth(currentLine);
    }

    /**
     * Get comprehensive line information including line number, offset, and line content
     * @param raw The raw source text
     * @returns Object containing line number, offset, and line content
     */
    public getLineInfo(raw: string): {
        line: number;
        offset: number;
        lineContent: string;
        errorLength: number;
    } {
        const line = this.getLine(raw);
        const offset = this.getInlineOffset(raw);
        const lines = this.splitLines(raw);
        const lineContent = lines[line - 1] ?? ""; // Convert to 0-based index for array access
        
        // Calculate error length for highlighting
        const errorLength = this.pos ? Math.max(1, this.pos.end - this.pos.start + 1) : 1;

        return {
            line,
            offset,
            lineContent,
            errorLength,
        };
    }

    /**
     * Convert the parser error to a standard Error with enhanced stack trace
     * @param raw The raw source text
     * @returns Enhanced Error object with line information
     */
    public toError(raw: string): Error {
        const { line, offset, lineContent, errorLength } = this.getLineInfo(raw);
        const error = new Error(`${this.message} (line ${line}, offset ${offset})`);

        // Create visual pointer that accounts for character widths
        let pointer = "";
        let currentWidth = 0;
        for (const char of lineContent) {
            const charWidth = this.getVisualWidth(char);
            if (currentWidth < offset) {
                pointer += " ".repeat(charWidth);
                currentWidth += charWidth;
            } else {
                break;
            }
        }
        
        // Add error highlighting - use '^' for single character, '~' for multiple characters
        if (errorLength <= 1) {
            pointer += "^";
        } else {
            pointer += "^" + "~".repeat(Math.max(0, errorLength - 1));
        }

        error.stack = `${error.stack}\n${lineContent}\n${pointer}`;
        error.name = this.type.toString();

        return error;
    }
}
