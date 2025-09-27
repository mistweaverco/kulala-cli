import type { KulalaDocument, KulalaParser } from "./types";
import { getAllContentsFromStdinAtOnce } from "./lib/helpers";
const kulalaParser = {} as KulalaParser;

const input = await getAllContentsFromStdinAtOnce();

const getDocument = async (): Promise<KulalaDocument> => {
  return {
    filepath: undefined,
    blocks: [],
  };
};

kulalaParser.parse = async (): Promise<KulalaDocument | null> => {
  switch (input.action) {
    case "parse":
      return await getDocument();
    case "run":
      console.log("Cursor Position:", input.cursorPosition);
      return await getDocument();
    default:
      break;
  }
  return null;
};

export { kulalaParser as KulalaParser };
