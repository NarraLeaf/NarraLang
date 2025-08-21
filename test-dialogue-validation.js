// Test script to verify the new multi-line dialogue validation logic

const fs = require('fs');
const path = require('path');

// Helper function to transpile TS to JS for testing
function transpileAndRequire(filePath) {
    const ts = require('typescript');
    const tsCode = fs.readFileSync(filePath, 'utf8');
    const jsCode = ts.transpile(tsCode, {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS
    });
    
    // Create a temporary file and require it
    const tempFile = filePath.replace('.ts', '.temp.js');
    fs.writeFileSync(tempFile, jsCode);
    const module = require(path.resolve(tempFile));
    fs.unlinkSync(tempFile);
    return module;
}

// Load the modules
const { isDialogue } = transpileAndRequire('./src/core/lexer/Dialogue.ts');
const { createLexerIterator } = transpileAndRequire('./src/core/lexer/LexerIterator.ts');

console.log('Testing multi-line dialogue validation...\n');

// Test cases
const testCases = [
    {
        name: "Valid multi-line dialogue",
        input: `character: {
"hello world"
"another line"
}`,
        expected: true
    },
    {
        name: "Invalid multi-line dialogue with comma",
        input: `character: {
"hello world",
"another line"
}`,
        expected: false
    },
    {
        name: "Invalid multi-line dialogue with semicolon",
        input: `character: {
"hello world";
"another line"
}`,
        expected: false
    },
    {
        name: "Invalid multi-line dialogue with extra text",
        input: `character: {
"hello world" extra
"another line"
}`,
        expected: false
    },
    {
        name: "Valid single-line dialogue",
        input: `character: "hello world"`,
        expected: true
    },
    {
        name: "Valid multi-line with whitespace",
        input: `character: {
    "hello world"    
    "another line"    
}`,
        expected: true
    }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
    try {
        const iterator = createLexerIterator(testCase.input);
        const result = isDialogue(iterator);
        
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`Input: ${JSON.stringify(testCase.input)}`);
        console.log(`Expected: ${testCase.expected}, Got: ${result}`);
        
        if (result === testCase.expected) {
            console.log('✅ PASSED\n');
            passedTests++;
        } else {
            console.log('❌ FAILED\n');
        }
    } catch (error) {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`❌ ERROR: ${error.message}\n`);
    }
});

console.log(`Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The multi-line dialogue validation is working correctly.');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please check the implementation.');
    process.exit(1);
}

