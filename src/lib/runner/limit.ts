import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import type { RunLimit } from '../kulala-core/types';

export type LimitOptions = {
  name?: string;
  line?: number;
  column?: number;
};

export function buildRunLimit(options: LimitOptions): RunLimit[] | undefined {
  const hasName = options.name !== undefined && options.name.length > 0;
  const hasLine = options.line !== undefined;
  const hasColumn = options.column !== undefined;

  if (hasName && (hasLine || hasColumn)) {
    console.error(chalk.red('Cannot use --name together with --line/--column'));
    process.exit(1);
  }

  if (hasColumn && !hasLine) {
    console.error(chalk.red('--column requires --line'));
    process.exit(1);
  }

  if (hasName) {
    return [{ filter: 'name', name: options.name as string }];
  }

  if (hasLine) {
    const line = options.line as number;
    if (!Number.isInteger(line) || line < 1) {
      console.error(chalk.red('--line must be a positive integer'));
      process.exit(1);
    }

    const column = options.column ?? 1;
    if (!Number.isInteger(column) || column < 1) {
      console.error(chalk.red('--column must be a positive integer'));
      process.exit(1);
    }

    return [{ filter: 'cursorPosition', line, column }];
  }

  return undefined;
}

export function resolveSingleHttpFile(inputPath: string): string {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  let stats: fs.Stats;

  try {
    stats = fs.lstatSync(absolutePath);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }

  if (!stats.isFile()) {
    console.error(chalk.red('--name and --line require a single .http or .rest file path'));
    process.exit(1);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  if (!['.http', '.rest'].includes(ext)) {
    console.error(chalk.red('Expected a .http or .rest file'));
    process.exit(1);
  }

  return path.relative(process.cwd(), absolutePath);
}
