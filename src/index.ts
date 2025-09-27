import { $ } from "bun";
import { parseArgs } from "util";

const SLICE_START_INDEX = 2;

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    format: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

async function main() {
  console.log({ values, positionals });

  const contents =
    positionals.length > SLICE_START_INDEX
      ? await Promise.all(
          positionals
            .slice(SLICE_START_INDEX)
            .map((file: string) => Bun.file(file).text()),
        )
      : [];

  console.log(contents);
  for (const content of contents) {
    const payload = new Response(
      JSON.stringify({ action: "parse", contents: content }),
    );
    // As long as we're developing, we can run the script directly with Bun
    const document =
      await $`bun run ./lib/core/src/index.ts < ${payload}`.text();
    console.log(document);
  }
}

main();
