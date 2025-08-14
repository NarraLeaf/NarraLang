import { OperatorType } from "@/core/lexer/Operator";
import { ParserIterator } from "../ParserIterator";
import { BinaryExpressionNode } from "./Expression";


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
    OperatorType.LogicalNot |

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
    OperatorType.LogicalNot,

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
