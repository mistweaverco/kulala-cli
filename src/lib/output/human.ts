import pc from 'picocolors';
import type {
  KulalaRequestErrorResponse,
  KulalaRequestSuccessResponse,
  KulalaResponseBody,
  KulalaResponseItem,
  KulalaResponseWrapper,
  KulalaScriptConsoleLine,
  RunFileResult,
} from '../kulala-core/types';

function isPromptResponse(
  item: KulalaResponseItem,
): item is Extract<KulalaResponseItem, { prompt: true }> {
  return 'prompt' in item && item.prompt === true;
}

function isSkippedResponse(
  item: KulalaResponseItem,
): item is Extract<KulalaResponseItem, { skipped: true }> {
  return 'skipped' in item && item.skipped === true;
}

function isWebSocketResponse(
  item: KulalaResponseItem,
): item is Extract<KulalaResponseItem, { protocol: 'websocket' }> {
  return 'protocol' in item && item.protocol === 'websocket';
}

function isErrorResponse(item: KulalaResponseItem): item is KulalaRequestErrorResponse {
  return item.success === false && !isPromptResponse(item);
}

function isSuccessResponse(item: KulalaResponseItem): item is KulalaRequestSuccessResponse {
  return item.success === true && !isSkippedResponse(item) && !isWebSocketResponse(item);
}

function responseBodyText(body: KulalaResponseBody | undefined): string {
  if (!body) {
    return '';
  }
  if (body.type === 'json') {
    return body.formatted ?? JSON.stringify(body.content, null, 2);
  }
  return body.content;
}

function statusColor(status: number): (text: string) => string {
  if (status >= 200 && status < 300) {
    return pc.green;
  }
  if (status >= 300 && status < 400) {
    return pc.yellow;
  }
  return pc.red;
}

function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
}

function formatScriptConsole(lines: KulalaScriptConsoleLine[] | undefined): string {
  if (!lines?.length) {
    return '';
  }

  return lines
    .map((line) => {
      const prefix =
        line.level === 'error'
          ? pc.red('[error]')
          : line.level === 'warn'
            ? pc.yellow('[warn]')
            : pc.dim(`[${line.level}]`);
      return `${prefix} ${line.message}`;
    })
    .join('\n');
}

function formatMs(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatItem(item: KulalaResponseItem): string {
  if (isPromptResponse(item)) {
    const parts = [pc.yellow(`Prompt (${item.promptType}): ${item.message}`)];
    for (const input of item.inputs) {
      parts.push(`  - ${input.label} (${input.type}${input.required ? ', required' : ''})`);
    }
    return parts.join('\n');
  }

  if (isSkippedResponse(item)) {
    const parts = [pc.dim(`Skipped${item.blockName ? ` [${item.blockName}]` : ''}`)];
    if (item.scriptConsole?.length) {
      parts.push(formatScriptConsole(item.scriptConsole));
    }
    return parts.join('\n');
  }

  if (isWebSocketResponse(item)) {
    const parts = [pc.cyan(`WebSocket: ${item.url}`)];
    if (item.initialMessage) {
      parts.push(pc.dim(`Initial message: ${item.initialMessage}`));
    }
    return parts.join('\n');
  }

  if (isErrorResponse(item)) {
    const parts = [pc.red(`Error${item.blockName ? ` [${item.blockName}]` : ''}: ${item.error}`)];
    if (item.url) {
      parts.push(pc.dim(`${item.request?.method ?? 'GET'} ${item.url}`));
    }
    if (item.status !== undefined) {
      parts.push(statusColor(item.status)(`HTTP ${item.status}`));
    }
    if (item.body) {
      parts.push('');
      parts.push(responseBodyText(item.body));
    }
    if (item.scriptConsole?.length) {
      parts.push('');
      parts.push(formatScriptConsole(item.scriptConsole));
    }
    return parts.join('\n');
  }

  if (isSuccessResponse(item)) {
    const method = item.request?.method ?? 'GET';
    const statusLabel =
      item.status >= 200 && item.status < 300
        ? statusColor(item.status)(`HTTP ${item.status}`)
        : pc.green(`HTTP ${item.status}`);
    const parts = [
      `${pc.bold(method)} ${item.url}${item.blockName ? pc.dim(` [${item.blockName}]`) : ''}`,
      statusLabel,
    ];

    if (item.timings?.total !== undefined) {
      parts.push(pc.dim(`Duration: ${formatMs(item.timings.total)}`));
    }

    if (Object.keys(item.headers).length > 0) {
      parts.push('');
      parts.push(pc.dim(formatHeaders(item.headers)));
    }

    const bodyText = responseBodyText(item.filteredBody ?? item.body);
    if (bodyText) {
      parts.push('');
      parts.push(bodyText);
    }

    if (item.scriptConsole?.length) {
      parts.push('');
      parts.push(formatScriptConsole(item.scriptConsole));
    }

    return parts.join('\n');
  }

  return pc.dim('Unknown response type');
}

function formatWrapper(wrapper: KulalaResponseWrapper): string {
  const items = wrapper.type === 'error' ? wrapper.data : wrapper.data;
  return items.map((entry) => formatItem(entry)).join('\n\n');
}

export function printHumanReadable(results: RunFileResult[]): void {
  const blocks = results.map((result) => {
    const header = results.length > 1 ? pc.bold(`# ${result.filepath}\n`) : '';
    return `${header}${formatWrapper(result.response)}`;
  });

  console.log(blocks.join('\n\n'));
}

export function printJson(results: RunFileResult[]): void {
  const payload = results.length === 1 ? results[0].response : results;
  console.log(JSON.stringify(payload, null, 2));
}

export function isResponseSuccessful(item: KulalaResponseItem): boolean {
  if (isPromptResponse(item)) {
    return false;
  }
  // Trust kulala-core's success flag (handles @kulala-expect-status-code, scripts, etc.)
  return item.success === true;
}

function filterFailedWrapper(wrapper: KulalaResponseWrapper): KulalaResponseWrapper | null {
  const items = wrapper.type === 'error' ? wrapper.data : wrapper.data;
  const failed = items.filter((item) => !isResponseSuccessful(item));
  if (failed.length === 0) {
    return null;
  }
  return { type: 'responses', data: failed };
}

export function filterFailedResults(results: RunFileResult[]): RunFileResult[] {
  return results.flatMap((result) => {
    const filtered = filterFailedWrapper(result.response);
    if (!filtered) {
      return [];
    }
    return [{ filepath: result.filepath, response: filtered }];
  });
}

export function countResults(wrapper: KulalaResponseWrapper): {
  total: number;
  success: number;
  failed: number;
} {
  const items = wrapper.type === 'error' ? wrapper.data : wrapper.data;
  let success = 0;
  let failed = 0;

  for (const item of items) {
    if (isResponseSuccessful(item)) {
      success += 1;
    } else {
      failed += 1;
    }
  }

  return { total: items.length, success, failed };
}

export { formatMs, responseBodyText };
