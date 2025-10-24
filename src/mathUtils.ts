import * as LJS from "littlejsengine";
const { vec2, rgb } = LJS;

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export const rgba = (r: number, g: number, b: number, a: number | undefined) =>
  rgb(r / 255, g / 255, b / 255, a);

export const setAlpha = (c: LJS.Color, a: number) =>
  c.copy().set(c.r, c.g, c.b, a);
