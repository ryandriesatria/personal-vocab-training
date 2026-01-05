import { normalizeAnswer, shuffle } from './quiz-helpers';

describe('quiz helpers', () => {
  it('normalizes answers by trimming and lowercasing', () => {
    expect(normalizeAnswer('  AppLE  ')).toBe('apple');
  });

  it('shuffles without mutating the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(input);

    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...output].sort()).toEqual([...input].sort());
  });
});
