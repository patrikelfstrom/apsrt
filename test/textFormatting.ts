export function toUpperCase(input: string): string {
  return input.toUpperCase();
}
export function toLowerCase(input: string): string {
  return input.toLowerCase();
}
export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
export function reverseString(input: string): string {
  return input.split("").reverse().join("");
}
export function isPalindrome(input: string): boolean {
  const reversed = input.split("").reverse().join("");
  return input === reversed;
}
export function countVowels(input: string): number {
  const vowels = "aeiouAEIOU";
  let count = 0;
  for (let char of input) {
    if (vowels.includes(char)) {
      count++;
    }
  }
  return count;
}
export function countConsonants(input: string): number {
  const consonants = "bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ";
  let count = 0;
  for (let char of input) {
    if (consonants.includes(char)) {
      count++;
    }
  }
  return count;
}
export function removeWhitespace(input: string): string {
  return input.replace(/\s+/g, "");
}
export function truncateString(input: string, length: number): string {
  if (input.length <= length) {
    return input;
  }
  return input.slice(0, length) + "...";
}
export function repeatString(input: string, times: number): string {
  return input.repeat(times);
}
export function splitString(input: string, delimiter: string): string[] {
  return input.split(delimiter);
}
export function joinStrings(input: string[], delimiter: string): string {
  return input.join(delimiter);
}
export function findSubstring(input: string, substring: string): number {
  return input.indexOf(substring);
}
export function replaceSubstring(
  input: string,
  target: string,
  replacement: string
): string {
  return input.replace(new RegExp(target, "g"), replacement);
}
