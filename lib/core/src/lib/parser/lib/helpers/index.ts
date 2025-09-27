import type { KulalaStdinParsed } from "../../types";

export const getAllContentsFromStdinAtOnce =
  async (): Promise<KulalaStdinParsed> => {
    const reader = Bun.stdin.stream().getReader();
    let contents = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunkText = new TextDecoder().decode(value);
      contents += chunkText;
    }
    reader.releaseLock();

    return JSON.parse(contents) as unknown as KulalaStdinParsed;
  };
