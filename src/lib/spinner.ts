const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

export function isInteractiveTerminal(): boolean {
  return process.stderr.isTTY === true;
}

export type Spinner = {
  start(message: string): void;
  stop(): void;
};

export function createSpinner(): Spinner {
  let timer: ReturnType<typeof setInterval> | undefined;
  let frame = 0;
  let message = '';

  const stop = (): void => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
    if (isInteractiveTerminal()) {
      process.stderr.write('\r\x1b[K');
    }
  };

  return {
    start(msg: string) {
      message = msg;
      if (!isInteractiveTerminal()) {
        console.error(message);
        return;
      }

      const render = (): void => {
        process.stderr.write(`\r${SPINNER_FRAMES[frame]} ${message}`);
        frame = (frame + 1) % SPINNER_FRAMES.length;
      };

      render();
      timer = setInterval(render, 80);
    },
    stop,
  };
}

export async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner();
  spinner.start(message);
  try {
    return await fn();
  } finally {
    spinner.stop();
  }
}
