import type { KulalaResponseBody } from '../kulala-core/types';

export type TerminalImageProtocol = 'kitty' | 'iterm2' | 'wezterm' | 'ghostty';

function isGhostty(): boolean {
  if (process.env.GHOSTTY_RESOURCES_DIR) {
    return true;
  }
  if ((process.env.TERM ?? '').includes('ghostty')) {
    return true;
  }
  return (process.env.TERM_PROGRAM ?? '').toLowerCase().includes('ghostty');
}

function isWezTerm(): boolean {
  if (process.env.WEZTERM_EXECUTABLE || process.env.WEZTERM_PANE) {
    return true;
  }
  return (process.env.TERM_PROGRAM ?? '').toLowerCase().includes('wezterm');
}

export function detectTerminalImageProtocol(): TerminalImageProtocol | null {
  if (process.env.KITTY_WINDOW_ID || (process.env.TERM ?? '').includes('xterm-kitty')) {
    return 'kitty';
  }
  // Ghostty uses the Kitty graphics protocol.
  if (isGhostty()) {
    return 'ghostty';
  }
  // WezTerm supports the iTerm2 inline image protocol (and optionally Kitty graphics).
  // iTerm2 OSC 1337 works without extra config on all platforms.
  if (isWezTerm()) {
    return 'wezterm';
  }
  // iTerm2 (macOS) – common env signals.
  if (process.env.TERM_PROGRAM === 'iTerm.app' || process.env.ITERM_SESSION_ID) {
    return 'iterm2';
  }
  return null;
}

export function isBinaryBody(
  body: KulalaResponseBody | undefined,
): body is Extract<KulalaResponseBody, { type: 'binary' }> {
  return body?.type === 'binary';
}

export function isImageBody(body: KulalaResponseBody | undefined): boolean {
  if (!body || (body.type !== 'text' && body.type !== 'binary')) {
    return false;
  }
  const mediaType = body.mediaType?.toLowerCase() ?? '';
  return mediaType.startsWith('image/');
}

export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `${bytes} B`;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function kittyImageEscape(base64: string): string {
  // Kitty graphics protocol: transmit base64 chunks.
  // https://sw.kovidgoyal.net/kitty/graphics-protocol/
  const CHUNK = 4096;
  let out = '';
  for (let i = 0; i < base64.length; i += CHUNK) {
    const chunk = base64.slice(i, i + CHUNK);
    const more = i + CHUNK < base64.length ? 1 : 0;
    // f=100 => PNG; kitty will detect from bytes too, but we don't have raw bytes here.
    // Use t=d (base64), a=T (transmit), m=1 for more chunks.
    out += `\u001b_Ga=T,t=d,m=${more};${chunk}\u001b\\`;
  }
  return out;
}

function iterm2ImageEscape(base64: string, byteLength: number): string {
  // iTerm2 inline images (OSC 1337).
  // https://iterm2.com/documentation-images.html
  return `\u001b]1337;File=inline=1;size=${byteLength};width=auto;height=auto;preserveAspectRatio=1:${base64}\u0007`;
}

export function renderImageInline(
  body: Extract<KulalaResponseBody, { type: 'binary' }>,
): string | null {
  const protocol = detectTerminalImageProtocol();
  if (!protocol) return null;
  if (body.encoding !== 'base64') return null;

  if (protocol === 'kitty' || protocol === 'ghostty') {
    return kittyImageEscape(body.content);
  }
  if (protocol === 'iterm2' || protocol === 'wezterm') {
    return iterm2ImageEscape(body.content, body.byteLength);
  }
  return null;
}
