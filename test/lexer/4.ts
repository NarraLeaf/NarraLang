import { lexer } from "../../src/index";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LexerError } from "../../src/core/lexer/LexerError";
import util from "util";
import { toErrorMessage } from "../../src/core/lexer/Lexer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const raw = fs.readFileSync(path.join(__dirname, "./examples/4.nls"), "utf-8");

console.log("=== 测试文件 4.nls - 字符串处理和对话 ===");
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
    
    // 特别关注字符串和对话相关的token
    const stringTokens = tokens.filter(token => 
        token.type === "String" || 
        token.type === "Dialogue" || 
        token.type === "MultiLineDialogue"
    );
    
    console.log("\n字符串和对话Token数量:", stringTokens.length);
    
    // 显示前5个字符串/对话token作为示例
    console.log("\n前5个字符串/对话Token示例:");
    console.log(util.inspect(stringTokens.slice(0, 5), { depth: null, colors: true }));
} else {
    console.error(toErrorMessage(tokens, raw));
} 