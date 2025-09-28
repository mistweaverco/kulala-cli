import type { KulalaDocument, KulalaParser } from "./types";
import {
  getAllContentsFromStdinAtOnce,
  writeToStderr,
  writeToStdout,
} from "./lib/helpers";
import { getDocument } from "./parser";
const kulalaParser = {} as KulalaParser;

const stdIn = await getAllContentsFromStdinAtOnce();

kulalaParser.parse = async (): Promise<void> => {
  let document: KulalaDocument | null = null;
  switch (stdIn.action) {
    case "parse":
      document = await getDocument(stdIn.content, stdIn.filepath);
      if (document.hasErrors) {
        writeToStderr(document);
        break;
      }
      writeToStdout(document);
      break;
    case "run":
      document = await getDocument(stdIn.content, stdIn.filepath);
      if (document.hasErrors) {
        writeToStderr(document);
        break;
      }
      writeToStdout(document);
      break;
    default:
      break;
  }
};

export { kulalaParser as KulalaParser };
