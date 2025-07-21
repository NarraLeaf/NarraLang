import { lexer } from "../../src/index";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LexerError } from "../../src/core/lexer/LexerError";
import util from "util";
import { toErrorMessage } from "../../src/core/lexer/Lexer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const raw = fs.readFileSync(path.join(__dirname, "./examples/3.nls"), "utf-8");

console.log("=== 测试文件 3.nls - 边缘案例和错误情况 ===");
const tokens = lexer(raw);

if (!LexerError.isLexerError(tokens)) {
    console.log("词法分析成功！");
    console.log("Token数量:", tokens.length);
    
    // 统计各种token类型
    const tokenStats = tokens.reduce((stats, token) => {
        stats[token.type] = (stats[token.type] || 0) + 1;
        return stats;
    }, {} as Record<string, number>);
    
    console.log("Token类型统计:");
    console.log(util.inspect(tokenStats, { depth: null, colors: true }));
    
    // 显示前10个token作为示例
    console.log("\n前10个Token示例:");
    console.log(util.inspect(tokens.slice(0, 10), { depth: null, colors: true }));
} else {
    console.log("词法分析失败:");
    console.log(util.inspect(tokens, { depth: null, colors: true }));
    console.error(toErrorMessage(tokens, raw));
} 