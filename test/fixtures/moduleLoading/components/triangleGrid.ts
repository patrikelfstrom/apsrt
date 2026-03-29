import { pickTriangleColor, triangleColor } from "../helpers/colors";

export function getTriangleColor() {
  return pickTriangleColor();
}

export function getTrianglePalette() {
  return [triangleColor, pickTriangleColor()];
}
