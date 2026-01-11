export const mergeClassNames = (...values: Array<string | undefined | null | false>): string =>
  values.filter(Boolean).join(' ');
