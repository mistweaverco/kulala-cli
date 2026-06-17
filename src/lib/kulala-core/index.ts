import { spawnSync } from 'node:child_process';
import { downloader } from '../downloader';
import type { KulalaEnvironmentCatalog, KulalaResponseWrapper, RunOptions } from './types';

export type { KulalaResponseWrapper, RunFileResult, RunOptions } from './types';

export type InvokeOptions = {
  cwd?: string;
};

let cachedExecutable: string | null = null;

async function executablePath(): Promise<string> {
  if (!cachedExecutable) {
    cachedExecutable = await downloader.ensureInstalled();
  }
  if (!cachedExecutable) {
    throw new Error('kulala-core executable not resolved');
  }
  return cachedExecutable;
}

function invoke(payload: Record<string, unknown>, options: InvokeOptions = {}): unknown {
  const exe = cachedExecutable;
  if (!exe) {
    throw new Error('kulala-core executable not resolved');
  }

  const result = spawnSync(exe, [], {
    input: `${JSON.stringify(payload)}\n`,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    cwd: options.cwd,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || `kulala-core exited with code ${result.status ?? 'unknown'}`,
    );
  }

  const stdout = result.stdout?.trim();
  if (!stdout) {
    throw new Error('kulala-core returned empty output');
  }

  return JSON.parse(stdout);
}

export async function runHttp(
  options: RunOptions,
  invokeOptions: InvokeOptions = {},
): Promise<KulalaResponseWrapper> {
  await executablePath();

  return invoke(
    {
      action: 'run',
      content: options.content,
      filepath: options.filepath,
      env: options.env,
      limit: options.limit,
      haltOnError: options.haltOnError,
    },
    invokeOptions,
  ) as KulalaResponseWrapper;
}

export async function environments(
  options: { cwd?: string; filepath?: string } = {},
  invokeOptions: InvokeOptions = {},
): Promise<KulalaEnvironmentCatalog> {
  await executablePath();

  return invoke(
    {
      action: 'environments',
      cwd: options.cwd,
      filepath: options.filepath,
    },
    invokeOptions,
  ) as KulalaEnvironmentCatalog;
}

export async function curl(
  options: { argv: string[] },
  invokeOptions: InvokeOptions = {},
): Promise<KulalaResponseWrapper> {
  await executablePath();

  return invoke(
    {
      action: 'curl',
      argv: options.argv,
    },
    invokeOptions,
  ) as KulalaResponseWrapper;
}

export const kulalaCore = {
  runHttp,
  environments,
  curl,
};
