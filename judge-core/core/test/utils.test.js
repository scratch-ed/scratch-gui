import { format } from '../src/utils';

describe('format', () => {
  test('normal replace', () => {
    expect(format('{0} is very nice', 'He')).toBe('He is very nice');
    expect(format('{0} is very {1}', 'He', 'nice')).toBe('He is very nice');
    expect(format('{0} is very {0}', 'He')).toBe('He is very He');
  });
  test('escape curly braces', () => {
    expect(format('{0} is very {{0}}', 'He')).toBe('He is very {0}');
  });
  test('Nested braces are not replaced', () => {
    expect(format('{0} is very nice', '{0}{1}')).toBe('{0}{1} is very nice');
  });
  test('Not enough params', () => {
    expect(() => {
      format('{0} is very {1}', 'He');
    }).toThrow();
  });
});
