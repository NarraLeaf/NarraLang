// Debug script to analyze nullish coalescing precedence
import { OperatorType } from './dist/core/lexer/Operator.js';
import { parseExpressionFromString } from './test/parser/helpers.js';

console.log('=== Operator Type Values ===');
console.log('OperatorType.And:', OperatorType.And);
console.log('OperatorType.Nullish:', OperatorType.Nullish);
console.log('OperatorType.Or:', OperatorType.Or);

console.log('\n=== Testing Expression: "a and b ?? c" ===');
try {
    const node = parseExpressionFromString('a and b ?? c');
    console.log('Parsed successfully');
    console.log('Root operator type:', node.operator);
    console.log('Root operator name:', Object.keys(OperatorType)[node.operator]);
    
    if (node.left) {
        console.log('Left node type:', node.left.type);
        if (node.left.operator !== undefined) {
            console.log('Left operator:', Object.keys(OperatorType)[node.left.operator]);
        }
    }
    
    if (node.right) {
        console.log('Right node type:', node.right.type);
        if (node.right.operator !== undefined) {
            console.log('Right operator:', Object.keys(OperatorType)[node.right.operator]);
        }
    }
} catch (e) {
    console.error('Parse error:', e.message);
}
