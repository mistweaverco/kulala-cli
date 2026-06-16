import chalk from 'chalk';
import { selectWithFilter } from './select';

export type SelectChoice = { name: string; value: string };

function isExitPromptError(err: unknown): err is { name?: string; message?: string } {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { name?: unknown; message?: unknown };
  const name = typeof anyErr.name === 'string' ? anyErr.name : '';
  const message = typeof anyErr.message === 'string' ? anyErr.message : '';
  return name === 'ExitPromptError' || /^User force closed the prompt\b/u.test(message);
}

function isCancelPromptError(err: unknown): err is { name?: string } {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { name?: unknown };
  return anyErr.name === 'CancelPromptError';
}

function exitMessageForPromptCancellation(err: { message?: string }): {
  message: string;
  code: number;
} {
  const msg = err.message ?? '';
  if (/\bSIGINT\b/u.test(msg)) {
    return { message: 'Cancelled (Ctrl+C).', code: 130 };
  }
  return { message: 'Cancelled.', code: 0 };
}

export async function pickOne(label: string, choices: SelectChoice[]): Promise<string> {
  if (!process.stdin.isTTY) {
    console.error(chalk.red(`${label} requires an interactive terminal.`));
    process.exit(1);
  }

  if (choices.length === 0) {
    console.error(chalk.red(`No options available for: ${label}`));
    process.exit(1);
  }

  try {
    const prompt = selectWithFilter<string>({
      message: label,
      choices: choices.map((c) => ({ name: c.name, value: c.value })),
      pageSize: Math.min(15, Math.max(choices.length, 5)),
    });

    const onKeypress = (_: unknown, key: { name?: string } | undefined) => {
      if (key?.name === 'escape') {
        prompt.cancel();
      }
    };
    process.stdin.on('keypress', onKeypress);

    try {
      return await prompt;
    } finally {
      process.stdin.off('keypress', onKeypress);
    }
  } catch (err) {
    if (isCancelPromptError(err)) {
      console.error(chalk.yellow('Cancelled.'));
      process.exit(0);
    }

    if (isExitPromptError(err)) {
      const { message, code } = exitMessageForPromptCancellation(err);
      console.error(chalk.yellow(message));
      process.exit(code);
    }
    throw err;
  }
}

export function extractRequestNamesFromHttp(content: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const line of content.split(/\r?\n/u)) {
    const match = /^###\s*(.*?)\s*$/u.exec(line);
    if (!match) continue;
    const name = match[1]?.trim();
    if (!name) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }

  return names;
}
