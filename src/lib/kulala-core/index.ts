import { spawnSync } from 'node:child_process';
import { downloader } from '../downloader';
import { isPromptResponse } from '../output/shared';
import type { KulalaEnvironmentCatalog, KulalaResponseWrapper, RunOptions } from './types';

export type { KulalaResponseWrapper, RunFileResult, RunOptions } from './types';

export type InvokeOptions = {
  cwd?: string;
};

type InvokeResult = {
  stdout: string;
  stderr: string;
  status: number | null;
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

function invokeRaw(payload: Record<string, unknown>, options: InvokeOptions = {}): InvokeResult {
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

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

export function tryDecodeWrapper(stdout: string): KulalaResponseWrapper | undefined {
  const raw = stdout.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const wrapper = JSON.parse(raw) as KulalaResponseWrapper;
    if (wrapper && typeof wrapper === 'object' && wrapper.type) {
      return wrapper;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseInvokeResponse(job: InvokeResult): KulalaResponseWrapper {
  const wrapper = tryDecodeWrapper(job.stdout);
  const first = wrapper?.type === 'responses' ? wrapper.data[0] : undefined;
  const isPrompt = Boolean(first && isPromptResponse(first));

  if (job.status !== 0 && !isPrompt) {
    throw new Error(
      job.stderr?.trim() || `kulala-core exited with code ${job.status ?? 'unknown'}`,
    );
  }

  if (!wrapper) {
    throw new Error(job.stderr?.trim() || 'kulala-core returned empty or invalid output');
  }

  return wrapper;
}

export async function runHttp(
  options: RunOptions,
  invokeOptions: InvokeOptions = {},
): Promise<KulalaResponseWrapper> {
  await executablePath();

  const job = invokeRaw(
    {
      action: 'run',
      content: options.content,
      filepath: options.filepath,
      env: options.env,
      limit: options.limit,
      haltOnError: options.haltOnError,
    },
    invokeOptions,
  );

  return parseInvokeResponse(job);
}

export async function continueHttp(
  options: { promptId: string; inputs: Array<{ id: string; value: string }> },
  invokeOptions: InvokeOptions = {},
): Promise<KulalaResponseWrapper> {
  await executablePath();

  const job = invokeRaw(
    {
      action: 'continue',
      promptId: options.promptId,
      inputs: options.inputs,
    },
    invokeOptions,
  );

  return parseInvokeResponse(job);
}

export async function environments(
  options: { cwd?: string; filepath?: string } = {},
  invokeOptions: InvokeOptions = {},
): Promise<KulalaEnvironmentCatalog> {
  await executablePath();

  const job = invokeRaw(
    {
      action: 'environments',
      cwd: options.cwd,
      filepath: options.filepath,
    },
    invokeOptions,
  );

  if (job.status !== 0) {
    throw new Error(
      job.stderr?.trim() || `kulala-core exited with code ${job.status ?? 'unknown'}`,
    );
  }

  const raw = job.stdout.trim();
  if (!raw) {
    throw new Error('kulala-core returned empty output');
  }

  return JSON.parse(raw) as KulalaEnvironmentCatalog;
}

export async function curl(
  options: { argv: string[] },
  invokeOptions: InvokeOptions = {},
): Promise<KulalaResponseWrapper> {
  await executablePath();

  const job = invokeRaw(
    {
      action: 'curl',
      argv: options.argv,
    },
    invokeOptions,
  );

  return parseInvokeResponse(job);
}

export const kulalaCore = {
  runHttp,
  continueHttp,
  environments,
  curl,
};
