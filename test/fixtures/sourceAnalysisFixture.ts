export function exportedDeclaration(name: string, count: number): string {
  return `${name}:${count}`;
}

export const exportedArrow = (enabled: boolean): boolean => !enabled;

export const exportedFunctionExpression = function (
  values: string[]
): number {
  return values.length;
};

const hiddenHelper = (value: string): string => value.trim();

export function usesHiddenHelper(value: string): string {
  return hiddenHelper(value);
}
