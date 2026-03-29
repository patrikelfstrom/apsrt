export function reverseArray<T>(array: T[]): T[] {
  const reversedArray: T[] = [];

  for (let index = array.length - 1; index >= 0; index -= 1) {
    reversedArray.push(array[index]);
  }

  return reversedArray;
}

export function filterArray<T>(
  array: T[],
  predicate: (item: T) => boolean
): T[] {
  const filteredArray: T[] = [];

  for (let index = 0; index < array.length; index += 1) {
    if (predicate(array[index])) {
      filteredArray.push(array[index]);
    }
  }

  return filteredArray;
}

export function mapArray<T, TResult>(
  array: T[],
  transform: (item: T) => TResult
): TResult[] {
  const mappedArray: TResult[] = [];

  for (let index = 0; index < array.length; index += 1) {
    mappedArray.push(transform(array[index]));
  }

  return mappedArray;
}

export function reduceArray<T, TResult>(
  array: T[],
  reducer: (accumulator: TResult, item: T) => TResult,
  initialValue: TResult
): TResult {
  let accumulator = initialValue;

  for (let index = 0; index < array.length; index += 1) {
    accumulator = reducer(accumulator, array[index]);
  }

  return accumulator;
}

export function findInArray<T>(
  array: T[],
  predicate: (item: T) => boolean
): T | undefined {
  for (let index = 0; index < array.length; index += 1) {
    if (predicate(array[index])) {
      return array[index];
    }
  }

  return undefined;
}
