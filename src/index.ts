import { parseArgs } from "util";
import { writeToStderr, writeToStdout } from "./lib/utils";
import type {
  KulalaCLIErrorResponse,
  KulalaCLISuccessResponse,
} from "./lib/utils";

const SLICE_START_INDEX = 2;

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    action: {
      type: "string",
    },
    format: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

type Content = { file: string; content: string };

async function main() {
  const res: KulalaCLISuccessResponse = { documents: [] };
  const err: KulalaCLIErrorResponse = { errors: [] };
  const mapped: Content[] =
    positionals.length > SLICE_START_INDEX
      ? await Promise.all(
          positionals.slice(SLICE_START_INDEX).map(async (file: string) =>
            Bun.file(file)
              .text()
              .then((content) => ({ file, content })),
          ),
        )
      : [];

  if (mapped.length === 0) {
    err.errors.push({ errorMessage: "No input files provided." });
    writeToStderr(err, 1);
  }
  for (const m of mapped) {
    const payload = new Response(
      JSON.stringify({ action: "parse", content: m.content, filepath: m.file }),
    );
    const cmd =
      process.env.NODE_ENV === "production"
        ? ["kulala-core"]
        : ["bun", "run", "./lib/core/src/index.ts"];
    const proc = Bun.spawn(cmd, {
      stdin: payload,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    });

    const status = await proc.exited;
    const stdout = await proc.stdout.getReader().read();
    const stderr = await proc.stderr.getReader().read();
    const stdoutText = new TextDecoder().decode(stdout.value);
    const stderrText = new TextDecoder().decode(stderr.value);

    try {
      const json =
        status === 0
          ? JSON.parse(stdoutText as string)
          : JSON.parse(stderrText as string);
      res.documents.push(json);
    } catch (e) {
      const error = e as Error;
      err.errors.push({
        errorMessage: error.message,
      });
    }
  }

  if (values.action === "parse") {
    if (values.format === "json") {
      writeToStdout(res, true);
    }
  }
}

main();
