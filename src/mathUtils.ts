import * as LJS from "littlejsengine";
import { DEBUG, tileSize } from "./main";
const { vec2, rgb, tile } = LJS;

export type Maybe<T> = T | undefined

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export const myRandColor = () => {
  const opts = [LJS.YELLOW, LJS.RED, LJS.CYAN, LJS.PURPLE];
  return opts.at(LJS.randInt(0, opts.length - 1));
};

export const rgba = (r: number, g: number, b: number, a = 1) =>
  rgb(r / 255, g / 255, b / 255, a);

export const setAlpha = (c: LJS.Color, a: number) =>
  c.copy().set(c.r, c.g, c.b, a);

/** Returns a new color preserving the HSLA values of the color passed in. */
export const setHSLA = (
  c: LJS.Color,
  { h, s, l, a }: { h?: number; s?: number; l?: number; a?: number } = {}
) => {
  const [ch, cs, cl, ca] = c.HSLA();
  return c.copy().setHSLA(h ?? ch, s ?? cs, l ?? cl, a ?? ca);
};

// https://www.desmos.com/calculator/r4gs7wf5lq
export const accuracy = (t: number) => 1 - Math.sin(t * Math.PI) ** 0.5;

export const repeat = <T>(value: T, n: number): T[] => Array(n).fill(value);

/**
 * Given a tile size and a position, figure out which quadrant of the tile we're in.
 *
 * The origin for `pos` is the top-left corner of the tile.
 */
export const getQuadrant = (size: LJS.Vector2, pos: LJS.Vector2) => {
  const r = vec2(pos.x % size.x, pos.y % size.y);
  const q = vec2((pos.x / size.x) >> 0, (pos.y / size.y) >> 0);

  return [vec2(Math.sign(r.x - size.x / 2), Math.sign(r.y - size.y / 2)), q];
};

export const formatTime = (t: number, timePrecision = 3) => {
  const [min, sec, mil] = [t / 60, Math.trunc(t) % 60, t - Math.trunc(t)];

  return `${min.toFixed(0).padStart(2, "0")}:${sec
    .toFixed(0)
    .padStart(2, "0")}:${mil
    .toFixed(timePrecision)
    .substring(2)
    .padStart(3, "0")}`;
};

export const formatDegrees = (d: number) =>
  `${(((d * RAD2DEG) >> 0) + 360) % 360}`;

export const formatPolar = ({ x: phi, y: dist }: LJS.Vector2) =>
  `(${formatDegrees(phi)}°, ${dist.toFixed(3)})`;

export const LOG = (...args: any[]) => {
  if (!DEBUG) return;
  const t = LJS.audioContext.currentTime;
  console.log(`[${formatTime(t)}] ${args.map((arg) => `${arg}`).join(" ")}`);
};

export const lerpVec2 = (start: LJS.Vector2, end: LJS.Vector2, value: number) =>
  start.add(end.subtract(start).scale(value));

export const lerpVec2InPlace = (
  start: LJS.Vector2,
  end: LJS.Vector2,
  t: number
) => {
  start.x = (1 - t) * start.x + t * end.x;
  start.y = (1 - t) * start.y + t * end.y;
  return start;
};

export const damp = (start: number, end: number, dt: number, lambda = 1) =>
  LJS.lerp(start, end, 1 - Math.exp(-lambda * dt));

export const dampVec2 = (
  start: LJS.Vector2,
  end: LJS.Vector2,
  dt: number,
  lambda = 1
) => lerpVec2(start, end, 1 - Math.exp(-lambda * dt));

export const dampVec2InPlace = (
  start: LJS.Vector2,
  end: LJS.Vector2,
  dt: number,
  lambda = 1
) => lerpVec2InPlace(start, end, 1 - Math.exp(-lambda * dt));

export const polar = vec2;
export const polar2cart = (p: LJS.Vector2, c = vec2()) =>
  c.add(vec2().setAngle(p.x, p.y));
