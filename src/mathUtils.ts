import * as LJS from "littlejsengine";
import { tileSize } from "./main";
const { vec2, rgb, tile } = LJS;

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export const rgba = (r: number, g: number, b: number, a: number | undefined) =>
  rgb(r / 255, g / 255, b / 255, a);

export const setAlpha = (c: LJS.Color, a: number) =>
  c.copy().set(c.r, c.g, c.b, a);

export const accuracy = (t: number) => Math.sin(t * Math.PI) ** 0.5;

export const particle = (
  pos: LJS.Vector2,
  {
    /** @property {Color} - Color at start of life */
    tileInfo = tile(0, tileSize, 2),
    angle = 0,
    /** @property {Color} - Color at start of life */
    colorStart = LJS.WHITE,
    /** @property {Color} - Color at end of life */
    colorEnd = LJS.CLEAR_WHITE,
    /** @property {number} - How long to live for */
    lifeTime = 1,
    /** @property {number} - Size at start of life */
    sizeStart = 1,
    /** @property {number} - Size at end of life */
    sizeEnd = 2,
    /** @property {number} - How quick to fade in/out */
    fadeRate = 0,
    /** @property {boolean} - Is it additive */
    additive = true,
    /** @property {number} - If a undefined, how long to make it */
    trailScale = 0,
    /** @property {ParticleEmitter} - Parent emitter if local space */
    localSpaceEmitter = undefined,
    /** @property {ParticleCallbackFunction} - Called when particle dies */
    destroyCallback = undefined,
    // particles do not clamp speed by default
  } = {}
) =>
  new LJS.Particle(
    pos,
    tileInfo,
    angle,
    colorStart,
    colorEnd,
    lifeTime,
    sizeStart,
    sizeEnd,
    fadeRate,
    additive,
    trailScale,
    localSpaceEmitter,
    destroyCallback
  );
