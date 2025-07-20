
export enum LexerErrorType {
    UnexpectedToken = "UnexpectedToken",
    UnclosedExpression = "UnclosedExpression",
    UnclosedString = "UnclosedString",
    UnclosedTag = "UnclosedTag",
    UnknownTag = "UnknownTag",
    UnexpectedNewLine = "UnexpectedNewLine",

    UnknownError = "UnknownError",

    StringParsingError = "StringParsingError",
}

export class LexerError extends Error {
    public type: LexerErrorType;
    public index: number;

    public static isLexerError(error: unknown): error is LexerError {
        return error instanceof LexerError;
    }

    constructor(type: LexerErrorType, message: string, index: number) {
        super(message);

        this.name = "LexerError";
        this.type = type;
        this.index = index;
    }

    /**
     * Split text by line endings, handling \r, \r\n, and \n
     * @param text The text to split
     * @returns Array of lines without line endings
     */
    private splitLines(text: string): string[] {
        // Normalize line endings to \n first, then split
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
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
        const lines = this.splitLines(raw.slice(0, this.index));
        return lines.length;
    }

    /**
     * Get the visual column offset within the current line (0-based)
     * @param raw The raw source text
     * @returns Visual column offset (0-based)
     */
    public getInlineOffset(raw: string): number {
        const lines = this.splitLines(raw.slice(0, this.index));
        const currentLine = lines[lines.length - 1] ?? '';
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
    } {
        const line = this.getLine(raw);
        const offset = this.getInlineOffset(raw);
        const lines = this.splitLines(raw);
        const lineContent = lines[line - 1] ?? ''; // Convert to 0-based index for array access

        return {
            line,
            offset,
            lineContent,
        };
    }

    /**
     * Convert the lexer error to a standard Error with enhanced stack trace
     * @param raw The raw source text
     * @returns Enhanced Error object with line information
     */
    public toError(raw: string): Error {
        const { line, offset, lineContent } = this.getLineInfo(raw);
        const error = new Error(`${this.message} (line ${line}, offset ${offset})`);

        // Create visual pointer that accounts for character widths
        let pointer = '';
        let currentWidth = 0;
        for (const char of lineContent) {
            const charWidth = this.getVisualWidth(char);
            if (currentWidth < offset) {
                pointer += ' '.repeat(charWidth);
                currentWidth += charWidth;
            } else {
                break;
            }
        }
        pointer += '^';

        error.stack = `${error.stack}\n${lineContent}\n${pointer}`;
        error.name = this.type.toString();

        return error;
    }
}

