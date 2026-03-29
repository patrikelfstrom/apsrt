/**
 * @apsrt-ignore
 */
export const ignoredRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

// @apsrt-ignore
export const ignoredRandomNumberLineComment = (
  min: number,
  max: number
): number => Math.floor(Math.random() * (max - min + 1) + min);
