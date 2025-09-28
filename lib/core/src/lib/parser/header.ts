import type { KulalaError } from "./types/error";
import type { KulalaHeader } from "./types/header";

export const getHeader = (
  line: string,
  lineIdx: number,
  filepath: string | null = null,
): KulalaHeader | KulalaError => {
  const splitLine = line.split(":");
  const name = splitLine.length > 0 ? splitLine[0].trim() : "";
  const value =
    splitLine.length > 1 ? splitLine.slice(1).join(":").trim() : undefined;
  if (name === "") {
    return {
      errorMessage: `Header name is empty at line ${lineIdx + 1}${
        filepath ? ` in file ${filepath}` : ""
      }`,
      lineNumber: lineIdx,
    };
  }
  return {
    name,
    value,
  };
};
