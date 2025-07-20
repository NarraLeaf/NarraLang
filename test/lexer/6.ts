import { lexer } from "../../src/index";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LexerError } from "../../src/core/lexer/LexerError";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const raw = fs.readFileSync(path.join(__dirname, "../../docs/zh/examples/6.nls"), "utf-8");

console.log("=== 测试文件 6.nls - 控制流和函数 ===");
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
    
    // 特别关注关键词相关的token（控制流和函数）
    const keywordTokens = tokens.filter(token => 
        token.type === "Keyword"
    );
    
    console.log("\n关键词Token数量:", keywordTokens.length);
    
    // 统计关键词类型
    const keywordStats = keywordTokens.reduce((stats, token) => {
        stats[token.value] = (stats[token.value] || 0) + 1;
        return stats;
    }, {} as Record<string, number>);
    
    console.log("\n关键词统计:");
    console.log(util.inspect(keywordStats, { depth: null, colors: true }));
    
    // 显示前10个关键词token作为示例
    console.log("\n前10个关键词Token示例:");
    console.log(util.inspect(keywordTokens.slice(0, 10), { depth: null, colors: true }));
} else {
    console.log("词法分析失败:");
    console.log(util.inspect(tokens, { depth: null, colors: true }));
} 