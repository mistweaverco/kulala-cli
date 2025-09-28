export type KulalaRequestBodyType =
  | "json"
  | "form"
  | "file"
  | "raw"
  | "graphql";

export type KulalaRequestGraphQLBody = {
  query: string;
  variables?: Record<string, unknown>;
};

export type KulalaRequestFormBody = {
  [key: string]: string;
};

export type KulalaRequestFileBody = {
  /** The path to the file to be uploaded */
  filePath: string;
  /** The filename to be used in the request, if different from the actual file name */
  filename?: string;
};

export type KulalaRequestRawBody = {
  contentType?: string;
};

export type KulalaRequestBody =
  | { type: "json"; content: string }
  | { type: "form"; content: KulalaRequestFormBody }
  | { type: "file"; content: KulalaRequestFileBody }
  | { type: "raw"; content: string }
  | { type: "graphql"; content: KulalaRequestGraphQLBody };
