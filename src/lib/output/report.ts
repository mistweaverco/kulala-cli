import type {
  KulalaRequestErrorResponse,
  KulalaRequestSuccessResponse,
  KulalaResponseItem,
  RunFileResult,
} from '../kulala-core/types';
import { formatMs, isResponseSuccessful, responseBodyText } from './human';

type ReportStats = {
  total: number;
  success: number;
  failed: number;
};

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

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function mdTable(rows: string[][]): string {
  if (rows.length === 0) {
    return '';
  }

  const header = rows[0];
  const separator = header.map(() => '---');
  const body = rows.slice(1);

  const formatRow = (row: string[]) => `| ${row.join(' | ')} |`;

  return [formatRow(header), formatRow(separator), ...body.map(formatRow)].join('\n');
}

function itemTitle(item: KulalaResponseItem): string {
  if (isPromptResponse(item)) {
    return `Prompt: ${item.promptType}`;
  }
  if (isSkippedResponse(item)) {
    return item.blockName ? `Skipped — ${item.blockName}` : 'Skipped';
  }
  if (isWebSocketResponse(item)) {
    return `WebSocket — ${item.url}`;
  }
  if (isErrorResponse(item)) {
    const method = item.request?.method ?? 'REQUEST';
    const url = item.url ?? item.blockName ?? 'unknown';
    return `${method} ${url}`;
  }
  if (isSuccessResponse(item)) {
    const method = item.request?.method ?? 'GET';
    return `${method} ${item.url}`;
  }
  return 'Unknown request';
}

function formatScriptSection(item: KulalaResponseItem): string {
  if (!('scriptConsole' in item) || !item.scriptConsole?.length) {
    return '';
  }

  const lines = item.scriptConsole.map(
    (line) => `- **${line.level.toUpperCase()}** ${escapeCell(line.message)}`,
  );
  return `#### Script output\n\n${lines.join('\n')}\n`;
}

function formatItemSection(item: KulalaResponseItem): string {
  const parts: string[] = [`## ${escapeCell(itemTitle(item))}\n`];
  const rows: string[][] = [['Field', 'Value']];

  if ('blockName' in item && item.blockName) {
    rows.push(['Block', escapeCell(item.blockName)]);
  }

  if (isErrorResponse(item)) {
    rows.push(['Error', escapeCell(item.error)]);
    if (item.url) {
      rows.push(['URL', escapeCell(item.url)]);
    }
    if (item.status !== undefined) {
      rows.push(['Status', String(item.status)]);
    }
  } else if (isPromptResponse(item)) {
    rows.push(['Message', escapeCell(item.message)]);
  } else if (isWebSocketResponse(item)) {
    rows.push(['URL', escapeCell(item.url)]);
  } else if (isSkippedResponse(item)) {
    rows.push(['Status', 'skipped']);
  } else if (isSuccessResponse(item)) {
    rows.push(['URL', escapeCell(item.url)]);
    rows.push(['Status', String(item.status)]);
    if (item.timings?.total !== undefined) {
      rows.push(['Duration', formatMs(item.timings.total)]);
    }
  }

  parts.push(mdTable(rows));
  parts.push('');

  if ('body' in item && item.body) {
    const body = 'filteredBody' in item && item.filteredBody ? item.filteredBody : item.body;
    const text = responseBodyText(body);
    if (text) {
      parts.push('#### Response body\n');
      parts.push('```');
      parts.push(text);
      parts.push('```');
      parts.push('');
    }
  }

  const script = formatScriptSection(item);
  if (script) {
    parts.push(script);
  }

  return parts.join('\n');
}

function formatSummary(stats: ReportStats): string {
  const rows = [
    ['', 'Total', 'Successful', 'Failed'],
    ['Requests', String(stats.total), String(stats.success), String(stats.failed)],
  ];
  return `## Summary\n\n${mdTable(rows)}\n`;
}

export function printReport(results: RunFileResult[]): void {
  const parts: string[] = ['# Requests report\n'];
  const stats: ReportStats = { total: 0, success: 0, failed: 0 };

  for (const result of results) {
    if (results.length > 1) {
      parts.push(`### File: ${result.filepath}\n`);
    }

    const items = result.response.type === 'error' ? result.response.data : result.response.data;
    for (const item of items) {
      parts.push(formatItemSection(item));
      stats.total += 1;
      if (isResponseSuccessful(item)) {
        stats.success += 1;
      } else {
        stats.failed += 1;
      }
    }
  }

  parts.push(formatSummary(stats));
  console.log(parts.join('\n'));
}
