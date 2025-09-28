import type { KulalaHeader } from "./header";

export type KulalaHttpMethodAvailable =
  | "DELETE"
  | "GET"
  | "GRAPHQL"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT";

export type KulalaHttpVersion = "HTTP/1.0" | "HTTP/1.1" | "HTTP/2" | "HTTP/3";

export type KulalaHttpMethodWithBody = Exclude<
  KulalaHttpMethodAvailable,
  "GET" | "HEAD" | "OPTIONS"
>;

export type KulalaHttpMethodWithoutBody = Extract<
  KulalaHttpMethodAvailable,
  "GET" | "HEAD" | "OPTIONS"
>;

export type KulalaHttpMethod =
  | KulalaHttpMethodWithBody
  | KulalaHttpMethodWithoutBody;

export type KulalaHttpScheme = "http" | "https" | "ws" | "wss";
export type KulalaHttpURL = `${KulalaHttpScheme}://${string}` | `/${string}`;

// Per specification, the request line consists of three parts:
// 1. The HTTP method (e.g., GET, POST, PUT, DELETE).
// 2. The Request-URI (Uniform Resource Identifier), which indicates the resource being requested
//    (e.g., /index.html, /api/data).
// 3. The HTTP version (e.g., HTTP/1.1, HTTP/2).
//
// These parts are separated by spaces, and the line ends with a carriage return and line feed (CRLF).
// An example of a complete HTTP request line is:
//    GET /index.html HTTP/1.1
//    POST /api/data HTTP/2
//    PUT /resource/123 HTTP/1.1
//    DELETE /item/456 HTTP/1.0
//    HEAD /status HTTP/1.1
//    OPTIONS /options HTTP/1.1
//
// The .http specification varies slightly in that you could technically omit
// the HTTP method as well as the HTTP version, but in practice, these components
// are almost always included in real-world HTTP requests.
// Plus, this parser should always return a valid HTTP request line string,
// so we enforce the presence of all three components here.
export type KulalaHttpRequestLineString =
  `${KulalaHttpMethodAvailable} ${KulalaHttpURL} ${KulalaHttpVersion}`;

// We considered an array of objects,
// where each object represents a single header (name-value pair),
// a structure like Array<Record<string, string>>.
// It looks like this would be the most flexible way to represent headers,
// allowing for multiple headers with the same name and preserving order.
// However, this approach is really slow when it comes to lookups,
// as it requires iterating through the array to find a specific header.
// Additionally, it doesn't leverage TypeScript's strengths in type safety and clarity,
// making it less ideal for scenarios where headers need to be accessed frequently or validated.
type KulalaRequestHeaders = Record<string, KulalaHeader[]>;
type KulalaRequestBody = string | object;

// Considering the HTTP methods, we can categorize them into two groups:
// Methods that typically do not have a body (e.g., GET, HEAD, OPTIONS).
// Methods that usually include a body (e.g., POST, PUT, DELETE, PATCH, GRAPHQL).
// This categorization allows us to define two separate types for requests:

export type KulalaRequest = {
  method: KulalaHttpMethod;
  url: KulalaHttpURL;
  headers: KulalaRequestHeaders;
  body?: KulalaRequestBody;
};
