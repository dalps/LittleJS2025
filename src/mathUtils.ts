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

export class MyParticle extends LJS.Particle {
  spin: number;
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
  }

  update(): void {
    super.update();

    if (this.spin) this.velocity = this.velocity.rotate(this.spin);
  }

  render(): void {
    // lerp color and size
    const t =
      this.lifeTime > 0
        ? LJS.min((LJS.time - this.spawnTime) / this.lifeTime, 1)
        : 1;
    const radius = this.sizeFunc(t); // p2 * this.sizeStart + p1 * this.sizeEnd;
    const size = vec2(radius);
    this.color.lerp(this.colorEnd, t);

    // fade alpha
    const fadeRate = this.fadeRate / 2;
    this.color.a *=
      t < fadeRate ? t / fadeRate : t > 1 - fadeRate ? (1 - t) / fadeRate : 1;

    // draw the particle
    this.additive && LJS.setBlendMode(true);

    // update the position and angle for drawing
    let pos = this.pos,
      angle = this.angle;
    if (this.localSpaceEmitter) {
      // in local space of emitter
      const a = this.localSpaceEmitter.angle;
      const c = Math.cos(a),
        s = Math.sin(a);
      pos = this.localSpaceEmitter.pos.add(
        vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c)
      );
      angle += this.localSpaceEmitter.angle;
    }
    if (this.trailScale) {
      // trail style particles
      const direction = this.localSpaceEmitter
        ? this.velocity.rotate(-this.localSpaceEmitter.angle)
        : this.velocity;
      const speed = direction.length();
      if (speed) {
        // stretch in direction of motion
        const trailLength = speed * this.trailScale;
        size.y = Math.max(size.x, trailLength);
        angle = Math.atan2(direction.x, direction.y);
        LJS.drawTile(pos, size, this.tileInfo, this.color, angle, this.mirror);
      }
    } else
      LJS.drawTile(pos, size, this.tileInfo, this.color, angle, this.mirror);
    this.additive && LJS.setBlendMode();
  }
}
