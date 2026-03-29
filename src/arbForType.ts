import fc from "fast-check";

const primitiveTypes = ["string", "number", "boolean"];

function isPrimitiveType(typeText: string): boolean {
  return primitiveTypes.includes(typeText.toLowerCase());
}

function isArrayType(typeText: string): boolean {
  return typeText.endsWith("[]");
}

function getElementTypeFromArray(typeText: string): string {
  return typeText.split("[")[0];
}

function isFunctionType(typeText: string): boolean {
  return typeText.includes("=>");
}

function getArgumentTypesFromFunction(fnSig: string): string[] {
  // Get the argument part inside parentheses
  const argsMatch = fnSig.match(/\(([^)]*)\)/);
  if (!argsMatch) return [];

  const args = argsMatch[1]; // "item: T, value: Value, state: boolean"

  // Split and map to get just the type
  return args
    .split(",")
    .map((arg) => arg.trim().split(":")[1]?.trim())
    .filter(Boolean);
}

export function arbForType(typeText: string): fc.Arbitrary<unknown> {
  // Check for array types, string[], T[]
  if (isArrayType(typeText)) {
    const elementType = getElementTypeFromArray(typeText);

    // If the element type is a primitive type, use the corresponding arb
    if (isPrimitiveType(elementType)) {
      return fc.array(arbForType(elementType));
    }

    // if not a primitive type, return anything
    return fc.array(fc.anything());
  }

  // Check for function types, (item: T, value: Value, state: boolean) => void
  if (isFunctionType(typeText)) {
    const argTypes = getArgumentTypesFromFunction(typeText);

    // Loop through the argument types and create an array of arbs
    const argArbs = argTypes.map((argType) => {
      // If the argument type is a primitive type, use the corresponding arb
      if (isPrimitiveType(argType)) {
        return arbForType(argType);
      }

      // if not a primitive type, return anything
      return fc.anything();
    });

    // @ts-expect-error
    return fc.func(...argArbs);
  }

  const t = typeText.toLowerCase();

  // Check for primitives
  if (t.includes("string")) return fc.string();
  if (t.includes("number")) return fc.float();
  if (t.includes("boolean")) return fc.boolean();

  // If nothing matches, return anything
  return fc.anything();
}
