import { KeywordType } from "@/core/lexer/Keyword";
import { OperatorType } from "@/core/lexer/Operator";


export enum BinaryOperator_ {
    And,
    Or,
    LogicEqual,              // =
    LogicNotEqual,           // !=
    LogicGreaterThan,        // >
    LogicGreaterThanOrEqual, // >=
    LogicLessThan,           // <
    LogicLessThanOrEqual,    // <=
    Add,                     // +
    Subtract,                // -
    Multiply,                // *
    Divide,                  // /
    Modulo,                  // %
    Power,                   // **
    Nullish,                 // ??
    In,                      // in

}

export type BinaryOperator = (
    OperatorType.Plus |
    OperatorType.Minus |
    OperatorType.Asterisk |
    OperatorType.Slash |
    OperatorType.Percent |
    OperatorType.Exponent |
    
    OperatorType.LogicalEquals |
    OperatorType.LogicalNotEqual |
    OperatorType.LogicalGreaterThan |
    OperatorType.LogicalGreaterThanOrEqual |
    OperatorType.LogicalLessThan |
    OperatorType.LogicalLessThanOrEqual |

    OperatorType.Is |
    OperatorType.And |
    OperatorType.Or |

    OperatorType.IsNot |
    OperatorType.IsEqualTo |
    OperatorType.IsNotEqualTo |
    OperatorType.IsGreaterThan |
    OperatorType.IsGreaterThanOrEqual |
    OperatorType.IsLessThan |
    OperatorType.IsLessThanOrEqual |
    OperatorType.IsIn
);

export const BinaryOperators: BinaryOperator[] = [
    OperatorType.Plus,
    OperatorType.Minus,
    OperatorType.Asterisk,
    OperatorType.Slash,
    OperatorType.Percent,
    OperatorType.Exponent,

    OperatorType.LogicalEquals,
    OperatorType.LogicalNotEqual,
    OperatorType.LogicalGreaterThan,
    OperatorType.LogicalGreaterThanOrEqual,
    OperatorType.LogicalLessThan,
    OperatorType.LogicalLessThanOrEqual,

    OperatorType.Is,
    OperatorType.And,
    OperatorType.Or,

    OperatorType.IsNot,
    OperatorType.IsEqualTo,
    OperatorType.IsNotEqualTo,
    OperatorType.IsGreaterThan,
    OperatorType.IsGreaterThanOrEqual,
    OperatorType.IsLessThan,
    OperatorType.IsLessThanOrEqual,
    OperatorType.IsIn,
];

export function isBinaryOperator(op: OperatorType): boolean {
    return BinaryOperators.includes(op as BinaryOperator);
}

// Define unary prefix-only operators that cannot be used as infix operators
export const UnaryPrefixOnlyOperators: OperatorType[] = [
    OperatorType.LogicalNot,   // !
    OperatorType.Ellipsis,     // ...
];

export function isUnaryPrefixOnlyOperator(op: OperatorType): boolean {
    return UnaryPrefixOnlyOperators.includes(op);
}
