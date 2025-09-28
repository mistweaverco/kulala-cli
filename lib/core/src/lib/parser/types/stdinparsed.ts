export type KulalaStdinActionParse = {
  action: "parse";
  /* The path to the file where the contents come from, if any */
  filepath?: string;
  /* The full contents of the document to be processed */
  content: string;
};

export type KulalaStdinActionRun = {
  action: "run";
  /* The full contents of the document to be processed */
  content: string;
  /* The path to the file where the contents come from, if any */
  filepath?: string;
  /* The cursor position is 1-based index
   * line: The line number where the cursor is located
   * column: The column number where the cursor is located
   * If not provided, means that the whole document should be considered
   */
  cursorPosition?: { line: number; column: number };
};

export type KulalaStdinParsed = KulalaStdinActionParse | KulalaStdinActionRun;
