#!/usr/bin/env node

/**
 * NLS Test Scripts Runner
 * 运行所有 NLS 测试脚本的简单工具
 */

const fs = require('fs');
const path = require('path');

// 测试脚本列表
const testScripts = [
    '01-basic-syntax.nls',
    '02-functions.nls', 
    '03-control-flow.nls',
    '04-collections.nls',
    '05-strings.nls',
    '06-advanced-features.nls',
    '07-scenes-dialogues.nls',
    '08-edge-cases.nls'
];

// 测试脚本描述
const testDescriptions = {
    '01-basic-syntax.nls': 'Basic Syntax Tests - Variables, Data Types, Operators',
    '02-functions.nls': 'Function Tests - Regular Functions, Lambdas, Macro Functions',
    '03-control-flow.nls': 'Control Flow Tests - Conditions, Loops, Flow Control',
    '04-collections.nls': 'Collections Tests - Arrays, Objects, Tuples',
    '05-strings.nls': 'Strings Tests - String Operations, Text Elements, Dialogues',
    '06-advanced-features.nls': 'Advanced Features Tests - Destructuring, Spread, Promises',
    '07-scenes-dialogues.nls': 'Scenes & Dialogues Tests - Characters, Scenes, Conversations',
    '08-edge-cases.nls': 'Edge Cases Tests - Boundary Conditions, Error Handling'
};

function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function getFileStats(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const lineCount = content.split('\n').length;
        const charCount = content.length;
        
        return {
            size: stats.size,
            lineCount: lineCount,
            charCount: charCount,
            lastModified: stats.mtime
        };
    } catch (error) {
        return null;
    }
}

function runTests() {
    console.log('🚀 NarraLang Test Scripts Runner');
    console.log('=====================================\n');

    const scriptDir = __dirname;
    let totalFiles = 0;
    let existingFiles = 0;
    let totalLines = 0;
    let totalSize = 0;

    testScripts.forEach((script, index) => {
        totalFiles++;
        const filePath = path.join(scriptDir, script);
        const exists = checkFileExists(filePath);
        
        console.log(`${index + 1}. ${script}`);
        console.log(`   📝 ${testDescriptions[script] || 'No description available'}`);
        
        if (exists) {
            existingFiles++;
            const stats = getFileStats(filePath);
            
            if (stats) {
                totalLines += stats.lineCount;
                totalSize += stats.size;
                
                console.log(`   ✅ File exists (${stats.lineCount} lines, ${(stats.size / 1024).toFixed(1)}KB)`);
                console.log(`   📅 Last modified: ${stats.lastModified.toLocaleDateString()}`);
            } else {
                console.log(`   ✅ File exists (unable to read stats)`);
            }
        } else {
            console.log(`   ❌ File not found`);
        }
        
        console.log('');
    });

    // 汇总统计
    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`Total test scripts: ${totalFiles}`);
    console.log(`Existing files: ${existingFiles}`);
    console.log(`Missing files: ${totalFiles - existingFiles}`);
    console.log(`Total lines of code: ${totalLines.toLocaleString()}`);
    console.log(`Total size: ${(totalSize / 1024).toFixed(1)}KB`);
    
    if (existingFiles === totalFiles) {
        console.log('\n🎉 All test scripts are present and ready for testing!');
    } else {
        console.log(`\n⚠️  ${totalFiles - existingFiles} test script(s) missing. Please create them.`);
    }

    // 额外信息
    console.log('\n📚 Usage Instructions:');
    console.log('=======================');
    console.log('1. These scripts test various NarraLang features');
    console.log('2. Each script focuses on specific language aspects');
    console.log('3. Use these scripts with your NarraLang parser for testing');
    console.log('4. Check the README.md for detailed descriptions');
    
    console.log('\n🔧 Integration with NarraLang Parser:');
    console.log('======================================');
    console.log('// Example usage in your test suite:');
    console.log('const testFiles = [');
    testScripts.forEach(script => {
        console.log(`  './nls-scripts/${script}',`);
    });
    console.log('];');
    console.log('');
    console.log('testFiles.forEach(file => {');
    console.log('  const content = fs.readFileSync(file, "utf8");');
    console.log('  const parseResult = narraLangParser.parse(content);');
    console.log('  // Verify parse results...');
    console.log('});');

    return {
        totalFiles,
        existingFiles,
        missingFiles: totalFiles - existingFiles,
        totalLines,
        totalSize
    };
}

// 如果作为脚本直接运行
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    testScripts,
    testDescriptions,
    checkFileExists,
    getFileStats
};
