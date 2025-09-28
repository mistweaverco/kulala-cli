import type { KulalaDocument } from "./types";
import type {
  KulalaBlock,
  KulalaBlockLineType,
  KulalaSeenBlockLineTypes,
} from "./types/block";

import { pad } from "./lib/helpers";
import type { KulalaOperator } from "./types/operator";
import { getOperator } from "./operator";
import type { KulalaError } from "./types/error";
import type { KulalaScript } from "./types/script";
import { getScript } from "./script";
import { getHeader } from "./header";
import { getBody } from "./body";
import type { KulalaHeader } from "./types/header";
import { getComment } from "./comment";
import { getRequest } from "./request";
import type { KulalaRequest } from "./types/request";
import type { KulalaRequestBody } from "./types/body";
const blockRegex = /###(.*?)\n([\s\S]+?)(?=###|$)/g;
const nameRegex = /### (.+?)\n/;

const getBlockName = (rawBlock: string, idx: number): string => {
  return rawBlock.match(nameRegex)?.[1] || `REQUEST_${pad(idx + 1, 3, "0")}`;
};

const getLineType = (
  line: string,
  lineIdx: number,
  seenBlockTypes: KulalaSeenBlockLineTypes,
): KulalaBlockLineType => {
  if (lineIdx === 0) return { name: "name", lineNumber: lineIdx };
  if (line.startsWith("###")) return { name: "name", lineNumber: lineIdx };
  if (line.startsWith("< ")) {
    return { name: "preRequestScript", lineNumber: lineIdx };
  }
  if (line.startsWith("# @")) return { name: "operator", lineNumber: lineIdx };
  if (line.startsWith("#")) return { name: "comment", lineNumber: lineIdx };
  if (line.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT) /)) {
    return { name: "request", lineNumber: lineIdx };
  }
  if (
    seenBlockTypes.has("request") &&
    !seenBlockTypes.has("body") &&
    line.includes(": ")
  ) {
    return { name: "headers", lineNumber: lineIdx };
  }
  if (seenBlockTypes.has("request") && line.trim() === "") {
    return { name: "afterHeaders", lineNumber: lineIdx };
  }
  if (seenBlockTypes.has("afterHeaders") && line.startsWith("> ")) {
    return { name: "postRequestScript", lineNumber: lineIdx };
  }
  if (
    seenBlockTypes.has("request") &&
    seenBlockTypes.has("afterHeaders") &&
    !seenBlockTypes.has("afterBody") &&
    !seenBlockTypes.has("postRequestScript")
  ) {
    return { name: "body", lineNumber: lineIdx };
  }
  if (line.trim() === "" && seenBlockTypes.has("body")) {
    return { name: "afterBody", lineNumber: lineIdx };
  }
  return { name: "unknown", lineNumber: lineIdx };
};

const isError = (obj: unknown): obj is KulalaError => {
  return typeof obj === "object" && obj !== null && "errorMessage" in obj;
};

const getParsedBlock = async (
  rawBlock: string,
  idx: number,
  filepath?: string,
): Promise<KulalaBlock> => {
  let lineIdx = 0;
  let lineType: KulalaBlockLineType = { name: "name", lineNumber: lineIdx };
  let request: KulalaRequest | KulalaError;
  let header: KulalaHeader | KulalaError;
  let operator: KulalaOperator | KulalaError;
  let script: KulalaScript | KulalaError;
  let body: KulalaRequestBody | KulalaError;
  const seenBlockTypes: KulalaSeenBlockLineTypes = new Set<
    KulalaBlockLineType["name"]
  >();
  const lines = rawBlock.split("\n");
  const name = getBlockName(rawBlock, idx);
  const result: KulalaBlock = {
    name,
    errors: [],
    comments: [],
    request: {
      method: "GET",
      url: "/",
      headers: {},
    },
    operators: [],
    scripts: {
      preRequest: [],
      postRequest: [],
    },
  };
  for (const line of lines) {
    lineType = getLineType(line, lineIdx, seenBlockTypes);
    if (!seenBlockTypes.has(lineType.name)) {
      seenBlockTypes.add(lineType.name);
    }
    switch (lineType.name) {
      case "headers":
        header = getHeader(line, lineIdx);
        if (isError(header)) {
          result.errors.push(header);
          break;
        }
        if (!result.request.headers[header.name]) {
          result.request.headers[header.name] = [];
        }
        result.request.headers[header.name].push(header);
        break;
      case "comment":
        result.comments.push(getComment(line, lineIdx));
        break;
      case "request":
        request = getRequest(line, lineIdx);
        if (isError(request)) {
          result.errors.push(request);
          break;
        }
        result.request = request;
        break;
      case "operator":
        operator = getOperator(line, lineIdx);
        if (isError(operator)) {
          result.errors.push(operator);
          break;
        }
        result.operators.push(operator);
        break;
      case "body":
        body = await getBody(lines, lineIdx);
        if (isError(body)) {
          result.errors.push(body);
          break;
        }
        result.request.body = body;
        break;
      case "preRequestScript":
      case "postRequestScript":
        script = await getScript(line, lines, lineIdx, filepath);
        if (isError(script)) {
          result.errors.push(script);
          break;
        }
        result.scripts[script.type].push(script);
        break;
      default:
        break;
    }
    lineIdx++;
  }
  return result as KulalaBlock;
};

const getBlocks = async (
  content: string,
  filepath?: string,
): Promise<KulalaBlock[]> => {
  const blocks: KulalaBlock[] = [];
  const rawBlocks = content.matchAll(blockRegex);
  for (const [idx, rawBlock] of Array.from(rawBlocks).entries()) {
    blocks.push(await getParsedBlock(rawBlock[0], idx, filepath));
  }
  return blocks;
};

export const getDocument = async (
  content: string,
  filepath?: string,
): Promise<KulalaDocument> => {
  const blocks = await getBlocks(content, filepath);
  return {
    filepath,
    blocks,
  };
};
