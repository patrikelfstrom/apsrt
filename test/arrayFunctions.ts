export function reverseArray<T>(arr: T[]): T[] {
  const reversedArray: T[] = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    reversedArray.push(arr[i]);
  }
  return reversedArray;
}

export function filterArray<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  const filteredArray: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      filteredArray.push(arr[i]);
    }
  }
  return filteredArray;
}

export function mapArray<T, U>(arr: T[], transform: (item: T) => U): U[] {
  const mappedArray: U[] = [];
  for (let i = 0; i < arr.length; i++) {
    mappedArray.push(transform(arr[i]));
  }
  return mappedArray;
}

export function reduceArray<T, U>(
  arr: T[],
  reducer: (acc: U, item: T) => U,
  initialValue: U
): U {
  let accumulator = initialValue;
  for (let i = 0; i < arr.length; i++) {
    accumulator = reducer(accumulator, arr[i]);
  }
  return accumulator;
}

export function findInArray<T>(
  arr: T[],
  predicate: (item: T) => boolean
): T | undefined {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }
  return undefined;
}
