import { isCacheable } from '../../lib';

describe('isCacheable', () => {
  test.each([
    {
      value: null,
      label: 'value is null',
      result: false,
    },
    {
      value: undefined,
      label: 'value is undefined',
      result: false,
    },
    {
      value: [],
      label: 'value is an empty array',
      result: false,
    },
    {
      value: {},
      label: 'value is Object',
      result: true,
    },
  ])('should isCacheable be $result when $label', ({ value, result }) => {
    expect(isCacheable(value)).toBe(result);
  });
});
