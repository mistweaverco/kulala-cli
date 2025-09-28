export type KulalaOperatorName =
  | "accept"
  | "curl-insecure"
  | "curl-timeout"
  | "name"
  | "prompt";

export const kulalaOperatorNames: Set<KulalaOperatorName> = new Set([
  "accept",
  "curl-insecure",
  "curl-timeout",
  "name",
  "prompt",
]);

export type KulalaOperatorArgs = string | number | boolean;

export type KulalaOperatorString =
  `# @${KulalaOperatorName}${KulalaOperatorArgs extends string
    ? ` ${KulalaOperatorArgs}`
    : ""}`;

export type KulalaOperator = {
  name: KulalaOperatorName;
  args?: KulalaOperatorArgs;
  lineNumber: number;
};
