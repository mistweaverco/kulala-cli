import type { KulalaError } from "./types/error";
import type { KulalaOperator } from "./types/operator";
import { kulalaOperatorNames } from "./types/operator";

const operatorNameRequiresArgs = new Set(["accept", "curl-timeout", "name"]);

export const getOperator = (
  line: string,
  lineIdx: number,
): KulalaOperator | KulalaError => {
  const match = line.match(/^# @([A-z0-9_-]+)(?: (.+))?$/);
  if (!match) {
    return {
      errorMessage: `Invalid operator syntax at line ${lineIdx + 1}`,
      lineNumber: lineIdx,
      context: line,
    };
  }
  if (match.length < 2) {
    return {
      errorMessage: `Invalid operator syntax at line ${lineIdx + 1}`,
      lineNumber: lineIdx,
      context: match,
    };
  }
  if (operatorNameRequiresArgs.has(match[1]) && !match[2]) {
    return {
      errorMessage: `Operator "${match[1]}" requires an argument at line ${
        lineIdx + 1
      }`,
      lineNumber: lineIdx,
      context: line,
    };
  }
  if (!kulalaOperatorNames.has(match[1] as KulalaOperator["name"])) {
    return {
      errorMessage: `Unknown operator "${match[1]}" at line ${lineIdx + 1}`,
      lineNumber: lineIdx,
      context: line,
    };
  }
  return {
    name: match[1] as KulalaOperator["name"],
    args: match[2] || undefined,
    lineNumber: lineIdx,
  };
};
