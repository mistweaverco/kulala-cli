export type KulalaError = {
  errorMessage: string;
  lineNumber?: number;
  blockName?: string;
  context?: unknown;
};
