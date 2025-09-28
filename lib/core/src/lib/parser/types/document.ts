import type { KulalaVariable } from "./variable";
import type { KulalaBlock } from "./block";
export type KulalaDocument = {
  filepath?: string;
  variables?: Record<string, KulalaVariable>;
  blocks: KulalaBlock[];
  hasErrors?: boolean;
};
