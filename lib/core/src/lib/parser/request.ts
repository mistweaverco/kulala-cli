import type {
  KulalaHttpMethod,
  KulalaHttpScheme,
  KulalaHttpURL,
  KulalaRequest,
} from "./types/request";
import type { KulalaError } from "./types/error";

const getValidHttpMethods = (): KulalaHttpMethod[] => [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
  "GRAPHQL",
];

const isValidUrl = (url: KulalaHttpURL): boolean => {
  const schemes: KulalaHttpScheme[] = ["http", "https", "ws", "wss"];
  const schemePattern = schemes.join("|");
  // Regex to match URLs starting with / or a valid scheme followed by ://
  const urlPattern = new RegExp(
    `^(\\/|(${schemePattern}):\\/\\/)[\\w\\-]+(\\.[\\w\\-]+)+([\\w.,@?^=%&:/~+#\\-]*[\\w@?^=%&/~+#\\-])?$`,
  );
  return urlPattern.test(url);
};

export const getRequest = (
  line: string,
  lineIdx: number,
): KulalaRequest | KulalaError => {
  const splitLine = line.split(" ");
  const method: KulalaHttpMethod = splitLine[0] as KulalaHttpMethod;
  const url: KulalaHttpURL = (splitLine[1] || "") as KulalaHttpURL;
  if (!getValidHttpMethods().includes(method as KulalaHttpMethod)) {
    return {
      errorMessage: `Invalid HTTP method: ${method}`,
      lineNumber: lineIdx,
    };
  }
  if (!isValidUrl(url as KulalaHttpURL)) {
    return {
      errorMessage: `Invalid URL: ${url}`,
      lineNumber: lineIdx,
    };
  }

  return {
    method,
    url,
    lineNumber: lineIdx,
    headers: {},
  };
};
