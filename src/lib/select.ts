import {
  ValidationError,
  createPrompt,
  isBackspaceKey,
  isDownKey,
  isEnterKey,
  isUpKey,
  makeTheme,
  useEffect,
  useKeypress,
  useMemo,
  usePagination,
  usePrefix,
  useRef,
  useState,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type SelectTheme = {
  icon: {
    cursor: string;
  };
  style: {
    disabled: (text: string) => string;
    description: (text: string) => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
    message: (text: string, status: 'idle' | 'done') => string;
    answer: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
  indexMode: 'hidden' | 'number';
};

type Choice<Value> = {
  value: Value;
  name: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
};

function isSelectable<Value>(item: Choice<Value>): boolean {
  return !item.disabled;
}

function isCharKey(key: {
  sequence?: string;
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
}): boolean {
  if (key.ctrl || key.meta) return false;
  const seq = key.sequence ?? '';
  // Printable single chars (including space) but excluding escape itself.
  return seq.length === 1 && key.name !== 'escape';
}

function normalize(s: string): string {
  return s.toLowerCase();
}

function isSlashKey(key: { name?: string; sequence?: string }): boolean {
  // Different runtimes report "/" differently (name: "slash" vs sequence: "/")
  return key.name === 'slash' || key.sequence === '/';
}

export type SelectConfig<Value> = {
  message: string;
  choices: ReadonlyArray<Choice<Value>>;
  pageSize?: number;
  loop?: boolean;
  theme?: PartialDeep<import('@inquirer/core').Theme<SelectTheme>>;
  /** Press `/` to start filtering; type to narrow; Enter selects; Esc cancels */
  enableFilter?: boolean;
  /** Show help line explaining filter/navigation keys */
  showHelp?: boolean;
};

export type SelectPrompt<Value> = Promise<Value> & { cancel: () => void };

export function selectWithFilter<Value>(config: SelectConfig<Value>): SelectPrompt<Value> {
  const prompt = createPrompt<Value, SelectConfig<Value>>((promptConfig, done) => {
    const theme = makeTheme<SelectTheme>(
      {
        icon: { cursor: '❯' },
        style: {
          disabled: (x: string) => x,
          description: (x: string) => x,
          help: (x: string) => x,
          highlight: (x: string) => x,
          message: (x: string) => x,
          answer: (x: string) => x,
        },
        helpMode: 'auto',
        indexMode: 'hidden',
      },
      promptConfig.theme,
    );

    const prefix = usePrefix({ theme });
    const pageSize = promptConfig.pageSize ?? 15;
    const loop = promptConfig.loop ?? false;
    const enableFilter = promptConfig.enableFilter ?? true;
    const showHelp = promptConfig.showHelp ?? true;

    const rawItems = useMemo(
      () => promptConfig.choices.map((c) => ({ ...c, name: c.name ?? String(c.value) })),
      [promptConfig.choices],
    );

    const [status, setStatus] = useState<'idle' | 'done'>('idle');
    const [filterMode, setFilterMode] = useState<boolean>(false);
    const [filter, setFilter] = useState<string>('');
    const filterRef = useRef<string>('');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const filteredItems = useMemo(() => {
      if (!enableFilter) return rawItems;
      const q = normalize(filter.trim());
      if (!q) return rawItems;
      return rawItems.filter((item) => normalize(item.name).includes(q));
    }, [enableFilter, filter, rawItems]);

    const bounds = useMemo(() => {
      const first = filteredItems.findIndex(isSelectable);
      let last = -1;
      for (let i = filteredItems.length - 1; i >= 0; i--) {
        if (isSelectable(filteredItems[i]!)) {
          last = i;
          break;
        }
      }
      return { first, last };
    }, [filteredItems]);

    const [_, setActive] = useState<number>(0);
    const activeRef = useRef<number>(0);

    useEffect(() => {
      // Clamp active when filtering shrinks the list.
      if (filteredItems.length === 0) {
        setActive(0);
        activeRef.current = 0;
        return;
      }
      const first = bounds.first === -1 ? 0 : bounds.first;
      const last = bounds.last === -1 ? Math.max(0, filteredItems.length - 1) : bounds.last;
      const next = Math.min(last, Math.max(first, activeRef.current));
      setActive(next);
      activeRef.current = next;
    }, [bounds.first, bounds.last, filteredItems.length]);

    useKeypress((keyEvent, rl) => {
      clearTimeout(searchTimeoutRef.current);

      const key = keyEvent as unknown as {
        name?: string;
        sequence?: string;
        ctrl?: boolean;
        meta?: boolean;
        shift?: boolean;
      };

      // NOTE: Escape cancellation is handled by the caller via prompt.cancel().
      // Throwing here bypasses the prompt's normal promise rejection path in some runtimes.

      if (isEnterKey(keyEvent)) {
        const selected = filteredItems[activeRef.current];
        if (selected && isSelectable(selected)) {
          setStatus('done');
          done(selected.value);
        }
        return;
      }

      // Navigation: arrows always, plus j/k when not in filter typing mode.
      const down = isDownKey(keyEvent) || (!filterMode && key.name === 'j');
      const up = isUpKey(keyEvent) || (!filterMode && key.name === 'k');

      if (up || down) {
        rl.clearLine(0);
        if (filteredItems.length === 0 || bounds.first === -1) return;

        if (
          loop ||
          (up && activeRef.current !== bounds.first) ||
          (down && activeRef.current !== bounds.last)
        ) {
          const offset = up ? -1 : 1;
          let next = activeRef.current;
          do {
            next = (next + offset + filteredItems.length) % filteredItems.length;
          } while (!isSelectable(filteredItems[next]!));
          setActive(next);
          activeRef.current = next;
        }
        return;
      }

      if (enableFilter && isSlashKey(key) && !filterMode) {
        rl.clearLine(0);
        setFilterMode(true);
        setFilter('');
        filterRef.current = '';
        return;
      }

      if (enableFilter && filterMode) {
        if (isBackspaceKey(keyEvent)) {
          rl.clearLine(0);
          filterRef.current = filterRef.current.slice(0, -1);
          setFilter(filterRef.current);
          return;
        }

        // Leave filter mode when user types Enter handled above; Esc cancels prompt.
        if (isCharKey(key)) {
          rl.clearLine(0);
          filterRef.current = filterRef.current + (key.sequence ?? '');
          setFilter(filterRef.current);
          return;
        }
      }

      // When not filtering, ignore other keys (we don't do prefix-search like @inquirer/select).
    });

    useEffect(() => () => clearTimeout(searchTimeoutRef.current), []);

    const message = theme.style.message(promptConfig.message, status);
    const help =
      showHelp && status === 'idle'
        ? theme.style.help(
            enableFilter
              ? '(↑/↓ or j/k to navigate, / to filter, Enter to select, Esc to cancel)'
              : '(↑/↓ or j/k to navigate, Enter to select, Esc to cancel)',
          )
        : '';

    const filterLine =
      enableFilter && status === 'idle'
        ? theme.style.help(filterMode || filter.trim() ? `Filter: ${filter || ''}` : '')
        : '';

    const page = usePagination({
      items:
        filteredItems.length === 0
          ? ([
              { name: '(no matches)', value: undefined as unknown as Value, disabled: true },
            ] as Choice<Value>[])
          : filteredItems,
      active: activeRef.current,
      renderItem({ item, isActive, index }) {
        const indexLabel = theme.indexMode === 'number' ? `${index + 1}. ` : '';
        if (item.disabled) {
          const disabledLabel = typeof item.disabled === 'string' ? item.disabled : '(disabled)';
          return theme.style.disabled(`${indexLabel}${item.name} ${disabledLabel}`);
        }
        const color = isActive ? theme.style.highlight : (x: string) => x;
        const cursor = isActive ? theme.icon.cursor : ` `;
        return color(`${cursor} ${indexLabel}${item.name}`);
      },
      pageSize: Math.min(pageSize, Math.max(filteredItems.length, 5)),
      loop,
    });

    const selectedChoice = filteredItems[activeRef.current];
    if (status === 'done' && selectedChoice) {
      return `${prefix} ${message} ${theme.style.answer(selectedChoice.short ?? selectedChoice.name)}`;
    }

    const filterBlock = filterLine ? `${filterLine}\n` : '';
    const helpBlock = help ? `${help}\n` : '';
    return `${[prefix, message].filter(Boolean).join(' ')}\n${helpBlock}${filterBlock}${page}`;
  });

  // Validate upfront like @inquirer/select does.
  if (!config.choices.length) {
    throw new ValidationError('[select prompt] No choices provided.');
  }

  return prompt(config) as SelectPrompt<Value>;
}
