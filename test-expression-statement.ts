// Simple test to verify expression statement implementation
import { parse } from './src/core/parser/Parser';
import { lexer } from './src/core/lexer/Lexer';

// Test cases for expression statements
const testCases = [
    'x + 1',           // Expression statement
    'func()',          // Function call statement  
    'obj.prop',        // Member access statement
    'image',           // Simple identifier (sugar syntax)
    'character',       // Simple identifier (sugar syntax)
];

console.log('Testing expression statement implementation...\n');

testCases.forEach((code, index) => {
    try {
        console.log(`Test ${index + 1}: "${code}"`);
        const tokens = lexer(code);
        if (tokens.type && tokens.type === 'LexerError') {
            console.log(`  ❌ Lexer error: ${tokens.message}`);
            return;
        }
        
        const ast = parse(tokens);
        console.log(`  ✅ Parsed successfully`);
        console.log(`  📊 AST type: ${ast.body[0].type}`);
        if (ast.body[0].type === 'SugarCallStatement') {
            console.log(`  🍯 Sugar command: ${ast.body[0].name}`);
        } else if (ast.body[0].type === 'ExpressionStatement') {
            console.log(`  🔢 Expression type: ${ast.body[0].expression.type}`);
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
    console.log();
});

console.log('Test completed!');
