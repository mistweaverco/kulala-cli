import type { KulalaError } from "./types/error";
import { postRequestScriptMarker } from "./script";
import type {
  KulalaRequestBody,
  KulalaRequestBodyType,
  KulalaRequestFileBody,
  KulalaRequestGraphQLBody,
} from "./types/body";

export const isBody = (obj: unknown): obj is KulalaRequestBody => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const body = obj as KulalaRequestBody;
  if (!("type" in body) || !("content" in body)) {
    return false;
  }
  const validTypes: KulalaRequestBodyType[] = [
    "json",
    "form",
    "file",
    "raw",
    "graphql",
  ];
  if (!validTypes.includes(body.type)) {
    return false;
  }
  switch (body.type) {
    case "json":
      return typeof body.content === "string";
    case "form":
      return (
        typeof body.content === "object" &&
        body.content !== null &&
        !Array.isArray(body.content)
      );
    case "file":
      return (
        typeof body.content === "object" &&
        body.content !== null &&
        "filePath" in body.content &&
        typeof (body.content as KulalaRequestFileBody).filePath === "string"
      );
    case "raw":
      return typeof body.content === "string";
    case "graphql":
      return (
        typeof body.content === "object" &&
        body.content !== null &&
        "query" in body.content &&
        typeof (body.content as KulalaRequestGraphQLBody).query === "string"
      );
    default:
      return false;
  }
};

export const getBody = async (
  blockLines: string[],
  lineIdx: number,
): Promise<KulalaRequestBody | KulalaError> => {
  // fetch everything after lineIdx
  // until the end or up to the postRequestScriptMarker
  const contents = blockLines.slice(lineIdx).join("\n");
  const postRequestScriptMarkerPos = contents.indexOf(postRequestScriptMarker);
  const content =
    postRequestScriptMarkerPos !== -1
      ? contents.slice(0, postRequestScriptMarkerPos).trim()
      : contents.trim();
  return {
    type: "raw",
    content: contents,
  };
};
