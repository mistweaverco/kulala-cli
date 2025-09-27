import type { KulalaDocument } from "./document";

export type KulalaParser = {
  parse: () => Promise<KulalaDocument | null>;
};
