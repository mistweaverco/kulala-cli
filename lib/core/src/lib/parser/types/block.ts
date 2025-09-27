import type { KulalaRequest } from "./request.ts";
import type { KulalaOperatorArgs, KulalaOperatorName } from "./operator";
import type { KulalaScripts } from "./script";

// We considered an array of objects,
// where each object represents a single operator (name-value pair),
// a structure like Array<Record<string, string>>.
// It looks like this would be the most flexible way to represent operators,
// allowing for multiple operators, with the same name and preserving order.
// However, this approach is really slow when it comes to lookups,
// as it requires iterating through the array to find a specific operator,
// Additionally, it doesn't leverage TypeScript's strengths in type safety and clarity,
// making it less ideal for scenarios where operators need to be accessed frequently or validated.

export type KulalaBlock = {
  name: string;
  operators?: Record<KulalaOperatorName, KulalaOperatorArgs[]>;
  request: KulalaRequest;
  scripts?: KulalaScripts;
};
