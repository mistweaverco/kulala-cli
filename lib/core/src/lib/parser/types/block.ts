import type { KulalaRequest } from "./request.ts";
import type { KulalaOperator } from "./operator";
import type { KulalaComment } from "./comment";
import type { KulalaScripts } from "./script";
import type { KulalaError } from "./error.ts";

export type KulalaBlock = {
  name: string;
  errors: KulalaError[];
  comments: KulalaComment[];
  operators: KulalaOperator[];
  request: KulalaRequest;
  scripts: KulalaScripts;
};

export type KulalaBlockLineNumber = number;

export type KulalaBlockLineTypeName =
  | "afterBody"
  | "afterHeaders"
  | "body"
  | "comment"
  | "headers"
  | "name"
  | "operator"
  | "postRequestScript"
  | "preRequestScript"
  | "request"
  | "unknown";

export type KulalaBlockLineType = {
  name: KulalaBlockLineTypeName;
  lineNumber: KulalaBlockLineNumber;
};

export type KulalaSeenBlockLineTypes = Set<KulalaBlockLineTypeName>;
