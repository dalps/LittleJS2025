import * as LJS from "littlejsengine";
import { tileSize } from "./main";
const { vec2, rgb, tile } = LJS;

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export const rgba = (r: number, g: number, b: number, a: number | undefined) =>
  rgb(r / 255, g / 255, b / 255, a);

export const setAlpha = (c: LJS.Color, a: number) =>
  c.copy().set(c.r, c.g, c.b, a);

// https://www.desmos.com/calculator/ln6rtzn9kb
export const accuracy = (t: number) => Math.sin(t * Math.PI) ** 0.5;

export const repeat = <T>(value: T, n: number): T[] => Array(n).fill(value);

export function formatTime(t: number, timePrecision = 3) {
  const [min, sec, mil] = [t / 60, Math.trunc(t) % 60, t - Math.trunc(t)];

  return `${min.toFixed(0).padStart(2, "0")}:${sec
    .toFixed(0)
    .padStart(2, "0")}:${mil
    .toFixed(timePrecision)
    .substring(2)
    .padStart(3, "0")}`;
}

export function LOG(msg: string) {
  const t = LJS.audioContext.currentTime;
  console.log(`[${formatTime(t)}] ${msg}`);
}

export const lerpVec2 = (start: LJS.Vector2, end: LJS.Vector2, value: number) =>
  start.add(end.subtract(start).scale(value));

export const polar = vec2;
export const polar2cart = (p: LJS.Vector2, c = vec2()) =>
  c.add(vec2().setAngle(p.x, p.y));

export class MyParticle extends LJS.Particle {
  spin: number;
  trailRate: number;
  trailTimer: LJS.Timer;
  trail: {
    pos: LJS.Vector2;
    size: LJS.Vector2;
    angle: number;
    color: LJS.Color;
  }[] = [];
  sizeFunc: (t: number) => number;

  constructor(
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
      velocity = vec2(),
      angleVelocity = 0,
      spin = 0,
      sizeFunc = (t: number) => t,
      trailRate = 1 / 3,
    } = {}
  ) {
    super(
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

    this.color = this.colorStart = colorStart.copy();
    this.velocity = velocity;
    this.angleVelocity = angleVelocity;
    this.spin = spin;
    this.sizeFunc = sizeFunc;

    this.trailRate = trailRate;

    if (trailRate) this.trailTimer = new LJS.Timer(this.trailRate);
  }

  update(): void {
    super.update();

    if (this.trailRate && this.trailTimer.elapsed()) {
      const trailColor = this.color.copy();
      trailColor.a = 0.5;

      this.trail.push({
        pos: this.pos.copy(),
        angle: this.angle,
        size: this.size.copy(),
        color: trailColor,
      });

      this.trailTimer.set(this.trailRate);
    }

    if (this.spin) this.velocity = this.velocity.rotate(this.spin);
  }

  render(): void {
    // lerp color and size
    const t =
      this.lifeTime > 0
        ? LJS.min((LJS.time - this.spawnTime) / this.lifeTime, 1)
        : 1;
    const radius = this.sizeFunc(t); // p2 * this.sizeStart + p1 * this.sizeEnd;
    this.size = vec2(radius);
    this.color.lerp(this.colorEnd, t);

    // fade alpha
    const fadeRate = this.fadeRate / 2;
    this.color.a *=
      t < fadeRate ? t / fadeRate : t > 1 - fadeRate ? (1 - t) / fadeRate : 1;

    // draw the particle
    this.additive && LJS.setBlendMode(true);

    // update the position and angle for drawing
    this.trail.forEach(({ pos, angle, size, color }) => {
      color.a *= 0.98;
      LJS.drawTile(pos, size, this.tileInfo, color, angle, this.mirror);
    });

    LJS.drawTile(
      this.pos,
      this.size,
      this.tileInfo,
      this.color,
      this.angle,
      this.mirror
    );

    this.additive && LJS.setBlendMode();
  }
}
