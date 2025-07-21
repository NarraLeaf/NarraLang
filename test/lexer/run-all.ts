import { lexer } from "../../src/index";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LexerError } from "../../src/core/lexer/LexerError";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试文件列表
const testFiles = [
    { name: "1.nls", description: "基础示例" },
    { name: "2.nls", description: "全面数据类型和语法特性" },
    { name: "3.nls", description: "边缘案例和错误情况" },
    { name: "4.nls", description: "字符串处理和对话" },
    { name: "5.nls", description: "操作符和表达式" },
    { name: "6.nls", description: "控制流和函数" }
];

// 运行单个测试
function runTest(fileName: string, description: string) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`测试文件: ${fileName} - ${description}`);
    console.log(`${"=".repeat(60)}`);
    
    try {
        const filePath = path.join(__dirname, "./examples", fileName);
        const raw = fs.readFileSync(filePath, "utf-8");
        
        console.log(`文件大小: ${raw.length} 字符`);
        console.log(`行数: ${raw.split('\n').length}`);
        
        const startTime = Date.now();
        const tokens = lexer(raw);
        const endTime = Date.now();
        
        console.log(`词法分析耗时: ${endTime - startTime}ms`);
        
        if (!LexerError.isLexerError(tokens)) {
            console.log("✅ 词法分析成功！");
            console.log(`Token数量: ${tokens.length}`);
            
            // 统计各种token类型
            const tokenStats = tokens.reduce((stats, token) => {
                stats[token.type] = (stats[token.type] || 0) + 1;
                return stats;
            }, {} as Record<string, number>);
            
            console.log("Token类型统计:");
            Object.entries(tokenStats)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    console.log(`  ${type}: ${count}`);
                });
            
            // 特殊统计
            const specialStats = {
                "字符串Token": tokens.filter(t => t.type === "String").length,
                "对话Token": tokens.filter(t => t.type === "Dialogue" || t.type === "MultiLineDialogue").length,
                "操作符Token": tokens.filter(t => t.type === "Operator").length,
                "关键词Token": tokens.filter(t => t.type === "Keyword").length,
                "标识符Token": tokens.filter(t => t.type === "Identifier").length,
                "数字字面量": tokens.filter(t => t.type === "NumberLiteral").length,
                "注释Token": tokens.filter(t => t.type === "Comment").length,
            };
            
            console.log("特殊Token统计:");
            Object.entries(specialStats).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
            
        } else {
            console.log("❌ 词法分析失败:");
            console.log(util.inspect(tokens, { depth: null, colors: true }));
        }
        
    } catch (error) {
        console.log("❌ 文件读取失败:");
        console.log(error);
    }
}

// 运行所有测试
async function runAllTests() {
    console.log("🚀 开始运行所有词法分析测试");
    console.log(`测试时间: ${new Date().toLocaleString()}`);
    
    let successCount = 0;
    let totalCount = testFiles.length;
    
    for (const testFile of testFiles) {
        try {
            const filePath = path.join(__dirname, "./examples", testFile.name);
            const raw = fs.readFileSync(filePath, "utf-8");
            const tokens = lexer(raw);
            
            if (!LexerError.isLexerError(tokens)) {
                successCount++;
                console.log(`✅ ${testFile.name} - 成功 (${tokens.length} tokens)`);
            } else {
                console.log(`❌ ${testFile.name} - 失败`);
                console.error(tokens.stack);
            }
        } catch (error) {
            console.log(`❌ ${testFile.name} - 错误: ${error}`);
        }
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`测试总结: ${successCount}/${totalCount} 成功`);
    console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    console.log(`${"=".repeat(60)}`);
}

// 运行详细测试
async function runDetailedTests() {
    console.log("🔍 开始运行详细词法分析测试");
    
    for (const testFile of testFiles) {
        runTest(testFile.name, testFile.description);
    }
}

// 根据命令行参数选择运行模式
const args = process.argv.slice(2);
if (args.includes("--detailed") || args.includes("-d")) {
    runDetailedTests();
} else {
    runAllTests();
} 