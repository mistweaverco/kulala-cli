export type KulalaSessionItem = {
  lastModified: Date;
  data:
    | string
    | null
    | undefined
    | Record<string, unknown>
    | Array<unknown>
    | number
    | boolean;
};

/**
  Global session is a record of session items,
  where the key is the session name and the value is a KulalaSessionItem.
  This structure allows for easy retrieval and management of session data
  across the entire application.
  For example, to access a specific session item,
  you would use `globalSession[itemName]`.
  This design ensures that session data is both organized and easily accessible.
*/
export type KulalaGlobalSession = Record<string, KulalaSessionItem>;

/**
  Local session is a record of sessions for each file, where the key is the file path
  and the value is a record of session items for that file.
  Each session item is a record where the key is the session name
  and the value is a KulalaSessionItem.
  This structure allows for easy retrieval and management of session data
  specific to each file, while also maintaining a clear organization of session items.
  For example, to access a specific session item for a file,
  you would use `localSession[filePath][itemName]`.
  This design ensures that session data is both file-specific and easily accessible.
*/
export type KulalaLocalSession = Record<
  string,
  Record<string, KulalaSessionItem>
>;
