import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';
import type { KulalaPromptResponse } from './kulala-core/types';

export type PromptInput = { id: string; value: string };

let pipedBuffer = '';
let pipedEnded = false;
let pipedStdinInitialized = false;
const pipedWaiters: Array<(line: string | undefined) => void> = [];

function flushPipedWaiters(): void {
  while (pipedWaiters.length > 0) {
    const newlineIndex = pipedBuffer.indexOf('\n');
    if (newlineIndex === -1) {
      if (pipedEnded) {
        const line = pipedBuffer.replace(/\r?\n$/u, '');
        pipedBuffer = '';
        pipedWaiters.shift()?.(line.length > 0 ? line : undefined);
        continue;
      }
      break;
    }

    const line = pipedBuffer.slice(0, newlineIndex).replace(/\r$/u, '');
    pipedBuffer = pipedBuffer.slice(newlineIndex + 1);
    pipedWaiters.shift()?.(line);
  }

  if (pipedEnded) {
    while (pipedWaiters.length > 0) {
      pipedWaiters.shift()?.(undefined);
    }
  }
}

function initPipedStdin(): void {
  if (pipedStdinInitialized || input.isTTY) {
    return;
  }

  pipedStdinInitialized = true;
  input.setEncoding('utf8');
  input.on('data', (chunk: string) => {
    pipedBuffer += chunk;
    flushPipedWaiters();
  });
  input.on('end', () => {
    pipedEnded = true;
    flushPipedWaiters();
  });
  input.resume();
}

async function readPipedLine(): Promise<string | undefined> {
  initPipedStdin();

  const newlineIndex = pipedBuffer.indexOf('\n');
  if (newlineIndex !== -1) {
    const line = pipedBuffer.slice(0, newlineIndex).replace(/\r$/u, '');
    pipedBuffer = pipedBuffer.slice(newlineIndex + 1);
    return line;
  }

  if (pipedEnded) {
    const line = pipedBuffer.replace(/\r?\n$/u, '');
    pipedBuffer = '';
    return line.length > 0 ? line : undefined;
  }

  return new Promise((resolve) => {
    pipedWaiters.push(resolve);
  });
}

async function readVisibleLine(label: string): Promise<string | undefined> {
  if (!input.isTTY) {
    return readPipedLine();
  }

  const rl = createInterface({ input, output });
  try {
    return await new Promise<string>((resolve) => {
      rl.question(`${label}: `, resolve);
    });
  } finally {
    rl.close();
  }
}

async function readHiddenLine(label: string): Promise<string | undefined> {
  if (!input.isTTY) {
    return readPipedLine();
  }

  if (typeof input.setRawMode !== 'function') {
    return readVisibleLine(label);
  }

  output.write(`${label}: `);
  input.setRawMode(true);
  input.resume();
  input.setEncoding('utf8');

  return new Promise((resolve) => {
    let value = '';

    const cleanup = (result: string | undefined) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      output.write('\n');
      resolve(result);
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          cleanup(value);
          return;
        }
        if (char === '\u0003') {
          cleanup(undefined);
          return;
        }
        if (char === '\u007F' || char === '\b') {
          if (value.length > 0) {
            value = value.slice(0, -1);
          }
          continue;
        }
        value += char;
      }
    };

    input.on('data', onData);
  });
}

async function readPromptValue(
  label: string,
  type: 'text' | 'password' | 'url',
): Promise<string | undefined> {
  if (type === 'password') {
    return readHiddenLine(label);
  }
  return readVisibleLine(label);
}

export async function collectPromptInputs(
  prompt: KulalaPromptResponse,
): Promise<PromptInput[] | undefined> {
  const specs = prompt.inputs ?? [];
  if (specs.length === 0) {
    console.error(chalk.yellow('Kulala prompt has no inputs.'));
    return undefined;
  }

  const out: PromptInput[] = [];
  for (const spec of specs) {
    const id = spec.id;
    if (!id) {
      return undefined;
    }

    const label = spec.label?.trim() || id;
    const value = await readPromptValue(label, spec.type ?? 'text');
    if (value === undefined) {
      return undefined;
    }
    if (spec.required && !value.trim()) {
      console.error(chalk.yellow(`Required input missing: ${label}`));
      return undefined;
    }
    out.push({ id, value });
  }

  return out;
}
