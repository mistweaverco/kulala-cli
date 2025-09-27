export type KulalaOperatorName =
  | "accept"
  | "curl-insecure"
  | "curl-timeout"
  | "name"
  | "prompt";

export type KulalaOperatorArgs = string | number | boolean;

export type KulalaOperatorString =
  `# @${KulalaOperatorName}${KulalaOperatorArgs extends string
    ? ` ${KulalaOperatorArgs}`
    : ""}`;
