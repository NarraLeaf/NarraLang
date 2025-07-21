import { lexer } from "../../src/index";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LexerError } from "../../src/core/lexer/LexerError";
import util from "util";
import { toErrorMessage } from "../../src/core/lexer/Lexer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const raw = fs.readFileSync(path.join(__dirname, "./examples/1.nls"), "utf-8");

const tokens = lexer(raw);

if (!LexerError.isLexerError(tokens)) {
    console.log(util.inspect(tokens, { depth: null, colors: true }));
} else {
    console.error(toErrorMessage(tokens, raw));
}