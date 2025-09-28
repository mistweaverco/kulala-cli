export type KulalaCommentString = `# ${string}` | `## ${string}`;

export type KulalaComment = {
  content: string;
  lineNumber: number;
};
