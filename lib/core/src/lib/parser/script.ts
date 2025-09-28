import { dirname, relative, resolve } from "path";
import type { KulalaError } from "./types/error";
import type { KulalaScript } from "./types/script";

const inlineScriptRegex = /[<>] {%/;
export const preRequestScriptMarker = "< ";
export const postRequestScriptMarker = "> ";

export const getScript = async (
  line: string,
  blockLines: string[],
  lineIdx: number,
  filepath?: string,
): Promise<KulalaScript | KulalaError> => {
  const type = line.startsWith(preRequestScriptMarker)
    ? "preRequest"
    : "postRequest";
  const marker =
    type === "preRequest" ? preRequestScriptMarker : postRequestScriptMarker;
  const langRegex = /lang=(ts|js)/;
  const langMatch = line.match(langRegex);
  const langTest = langMatch ? langMatch[1] : null;
  const lang = langMatch ? (langMatch[1] as "ts" | "js") : "js";
  // Get the script content by joining all lines from
  // lineIdx to the end of the block
  // and removing the leading "> {%" or "< {%" with optional
  //" lang=js/ts and trailing " %>"
  const removeLang = langTest ? ` lang=${langTest}` : "";
  const contents = blockLines.slice(lineIdx).join("\n");
  const isInlineScript = inlineScriptRegex.test(line);
  const closingTag = contents.indexOf("%}");
  let content = "";
  if (isInlineScript) {
    content = contents
      .slice(
        line.indexOf(`{%${removeLang}`) + removeLang.length + 2,
        closingTag,
      )
      .trim();
  } else {
    if (!filepath) {
      return {
        errorMessage: `Cannot resolve external script path without a base filepath`,
        lineNumber: lineIdx,
        filepath,
      };
    }
    const scriptFilePath = line.slice(line.indexOf(marker) + marker.length);
    const scriptFileDir = dirname(filepath);
    const resolvedPath = resolve(scriptFileDir, scriptFilePath);
    filepath = relative(process.cwd(), resolvedPath);
    content = await Bun.file(resolvedPath).text();
  }
  if (content === "") {
    return {
      errorMessage: `Empty ${type} script`,
      lineNumber: lineIdx,
      filepath,
    };
  }
  return {
    type,
    lang,
    content,
    filepath,
    lineNumber: lineIdx,
  };
};
