import { buildTimeline, lineAt } from './player.service';
import { duration, fold, initials } from './format';

describe('timeline', () => {
  const detail = {
    slug: 'x',
    title: 'X',
    author: 'A',
    poet: null,
    year: null,
    lines: [
      [0, 'one two three'],
      [0, 'four five'],
      [0, ''],
      [0, 'six seven eight nine'],
    ] as [number, string][],
  };

  it('skips stanza breaks and keeps line order', () => {
    const t = buildTimeline(detail);
    expect(t.text).toEqual(['one two three', 'four five', 'six seven eight nine']);
    expect(t.source).toEqual([0, 1, 3]);
    expect(t.starts[0]).toBe(0);
    expect(t.starts[1]).toBeLessThan(t.starts[2]);
    expect(t.total).toBeGreaterThan(t.starts[2]);
  });

  it('adds a pause between stanzas', () => {
    const t = buildTimeline(detail);
    expect(t.starts[2] - t.ends[1]).toBe(960);
  });

  it('finds the line playing at a time', () => {
    const t = buildTimeline(detail);
    expect(lineAt(t.starts, 0)).toBe(0);
    expect(lineAt(t.starts, t.starts[1] + 1)).toBe(1);
    expect(lineAt(t.starts, t.total)).toBe(2);
    expect(lineAt([], 10)).toBe(-1);
  });
});

describe('format', () => {
  it('formats track durations', () => {
    expect(duration(5)).toBe('0:05');
    expect(duration(95)).toBe('1:35');
    expect(duration(3725)).toBe('1:02:05');
  });

  it('folds text for search', () => {
    expect(fold('Adá Limón’s “Poem”')).toBe('ada limons poem');
  });

  it('makes monogram initials', () => {
    expect(initials('Walt Whitman')).toBe('WW');
    expect(initials('H.D.')).toBe('HD');
    expect(initials('Rumi')).toBe('R');
  });
});
