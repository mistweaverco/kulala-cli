import type { KulalaDocument } from "../../../lib/core/src/lib/parser/types";
import type { KulalaError } from "../../../lib/core/src/lib/parser/types/error";

export type KulalaCLISuccessResponse = {
  documents: KulalaDocument[];
};

export type KulalaCLIErrorResponse = {
  errors: KulalaError[];
};

export const writeToStderr = (
  err: KulalaCLIErrorResponse,
  exit: number = 1,
): void => {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(err, null, 2) + "\n");
  Bun.stderr.write(data);
  if (exit) {
    process.exit(exit);
  }
};

export const writeToStdout = (
  res: KulalaCLISuccessResponse,
  exit: boolean = false,
): void => {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(res, null, 2) + "\n");
  Bun.stdout.write(data);
  if (exit) {
    process.exit(0);
  }
};
