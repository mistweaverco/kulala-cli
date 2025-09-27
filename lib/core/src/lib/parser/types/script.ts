export type KulalaScript = {
  lang: "ts" | "js";
  /** The path to the script file, or if inline the path of the http file */
  filepath: string;
  content: string;
};

export type KulalaScripts = {
  preRequest?: KulalaScript[];
  postRequest?: KulalaScript[];
};
