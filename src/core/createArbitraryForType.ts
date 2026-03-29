import fc from "fast-check";

const primitiveTypes = ["string", "number", "boolean"];
const unknownValueArbitrary = fc.anything({ maxDepth: 2, maxKeys: 5 });

function isPrimitiveType(typeText: string): boolean {
  return primitiveTypes.includes(typeText.toLowerCase());
}

function isArrayType(typeText: string): boolean {
  return typeText.endsWith("[]");
}

function getElementTypeFromArray(typeText: string): string {
  return typeText.slice(0, -2).trim();
}

function isFunctionType(typeText: string): boolean {
  return typeText.includes("=>");
}

function getReturnTypeFromFunction(typeText: string): string | null {
  const match = typeText.match(/=>\s*(.+)$/);
  return match?.[1]?.trim() ?? null;
}

export function createArbitraryForType(typeText: string): fc.Arbitrary<unknown> {
  if (isArrayType(typeText)) {
    const elementType = getElementTypeFromArray(typeText);
    const elementArbitrary = isPrimitiveType(elementType)
      ? createArbitraryForType(elementType)
      : unknownValueArbitrary;

    return fc.array(elementArbitrary);
  }

  if (isFunctionType(typeText)) {
    const returnType = getReturnTypeFromFunction(typeText);
    return fc.func(
      returnType ? createArbitraryForType(returnType) : unknownValueArbitrary
    );
  }

  const normalizedType = typeText.toLowerCase();

  if (normalizedType === "string") {
    return fc.string();
  }

  if (normalizedType === "number") {
    return fc.double({ noNaN: true, noDefaultInfinity: true });
  }

  if (normalizedType === "boolean") {
    return fc.boolean();
  }

  return unknownValueArbitrary;
}
