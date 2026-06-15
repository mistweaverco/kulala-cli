import { highlight } from 'cli-highlight';

let colorOverride: boolean | undefined;

export function setColorEnabled(enabled: boolean): void {
  colorOverride = enabled;
}

export function shouldColorize(): boolean {
  if (colorOverride === false) {
    return false;
  }
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }
  return process.stdout.isTTY ?? false;
}

export function highlightCode(text: string, language: string): string {
  if (!shouldColorize() || !text) {
    return text;
  }

  try {
    return highlight(text, { language, ignoreIllegals: true });
  } catch {
    return text;
  }
}
