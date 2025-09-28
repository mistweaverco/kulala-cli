export type KulalaScriptType = "preRequest" | "postRequest";

export type KulalaScript = {
  type: KulalaScriptType;
  lang: "ts" | "js";
  /** The path to the script file, or if inline the path of the http file */
  filepath?: string;
  content: string;
  lineNumber: number;
};

export type KulalaScripts = {
  [key in KulalaScriptType]: KulalaScript[];
};
