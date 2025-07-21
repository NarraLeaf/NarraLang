import { lexer } from "../../src/index";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LexerError } from "../../src/core/lexer/LexerError";
import util from "util";
import { toErrorMessage } from "../../src/core/lexer/Lexer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const raw = fs.readFileSync(path.join(__dirname, "./examples/5.nls"), "utf-8");

console.log("=== 测试文件 5.nls - 操作符和表达式 ===");
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
    
    // 特别关注操作符相关的token
    const operatorTokens = tokens.filter(token => 
        token.type === "Operator" || 
        token.type === "Keyword"
    );
    
    console.log("\n操作符和关键词Token数量:", operatorTokens.length);
    
    // 统计操作符类型
    const operatorStats = operatorTokens.reduce((stats, token) => {
        if (token.type === "Operator") {
            stats[token.value] = (stats[token.value] || 0) + 1;
        } else if (token.type === "Keyword") {
            stats[`keyword_${token.value}`] = (stats[`keyword_${token.value}`] || 0) + 1;
        }
        return stats;
    }, {} as Record<string, number>);
    
    console.log("\n操作符和关键词统计:");
    console.log(util.inspect(operatorStats, { depth: null, colors: true }));
    
    // 显示前10个操作符token作为示例
    console.log("\n前10个操作符Token示例:");
    console.log(util.inspect(operatorTokens.slice(0, 10), { depth: null, colors: true }));
} else {
    console.error(toErrorMessage(tokens, raw));
} 