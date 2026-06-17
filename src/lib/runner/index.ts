import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { fileWalker } from '../filewalker';
import { kulalaCore } from '../kulala-core';
import type { RunFileResult } from '../kulala-core/types';
import {
  countResults,
  filterFailedResults,
  printHumanReadable,
  printJson,
  printReport,
  printTests,
} from '../output';
import { setColorEnabled } from '../output/highlight';
import { buildRunLimit, resolveSingleHttpFile } from './limit';
import type { RunLimit } from '../kulala-core/types';

const HTTP_EXTENSIONS = ['.http', '.rest'];

export type RunCommandOptions = {
  json?: boolean;
  report?: boolean;
  tests?: boolean;
  quiet?: boolean;
  halt?: boolean;
  shuffle?: boolean;
  env?: string;
  name?: string;
  line?: number;
  column?: number;
  color?: boolean;
};

function shuffleFiles<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resolveFiles(inputPath: string, shuffle: boolean): string[] {
  let files = fileWalker(inputPath, HTTP_EXTENSIONS);
  if (files.length === 0) {
    console.error(chalk.red(`No .http or .rest files found at: ${inputPath}`));
    process.exit(1);
  }

  files.sort();
  if (shuffle) {
    files = shuffleFiles(files);
  }

  return files;
}

function responseHasFailure(result: RunFileResult): boolean {
  return countResults(result.response).failed > 0;
}

async function runFile(
  relativePath: string,
  env: string | undefined,
  limit: RunLimit[] | undefined,
  halt: boolean,
): Promise<RunFileResult> {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const cwd = path.dirname(absolutePath);

  const response = await kulalaCore.runHttp(
    {
      content,
      filepath: absolutePath,
      env,
      limit,
      haltOnError: halt,
    },
    { cwd },
  );

  return { filepath: relativePath, response };
}

function hasFailures(results: RunFileResult[]): boolean {
  return results.some((result) => responseHasFailure(result));
}

export async function run(inputPath: string, options: RunCommandOptions): Promise<void> {
  if (options.color === false) {
    setColorEnabled(false);
  }

  // Backwards compatibility: --report is replaced by --tests.
  if (options.report && !options.tests) {
    options.tests = true;
  }

  const limit = buildRunLimit(options);
  const files = limit
    ? [resolveSingleHttpFile(inputPath)]
    : resolveFiles(inputPath, options.shuffle ?? false);
  const results: RunFileResult[] = [];

  const halt = options.halt ?? false;

  for (const file of files) {
    const result = await runFile(file, options.env, limit, halt);
    results.push(result);

    if (halt && responseHasFailure(result)) {
      break;
    }
  }

  const outputResults = options.quiet && !options.tests ? filterFailedResults(results) : results;

  if (options.tests) {
    // Tests mode handles its own "quiet" filtering because failures include test failures.
    printTests(results, { quiet: options.quiet ?? false });
  } else if (!options.quiet || outputResults.length > 0) {
    if (options.json) {
      printJson(outputResults);
    } else if (options.report) {
      printReport(outputResults);
    } else {
      printHumanReadable(outputResults);
    }
  }

  if (hasFailures(results)) {
    process.exit(1);
  }
}
