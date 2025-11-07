import * as LJS from "littlejsengine";
import { tileSize } from "./main";
import { LOG, setAlpha } from "./mathUtils";
const { vec2, rgb, tile } = LJS;

export const emitter = ({
  pos = vec2(),
  angle = 0,
  emitSize = 0,
  emitTime = 0,
  emitRate = 100,
  emitConeAngle = 0,
  tileInfo = tile(),
  colorStartA = LJS.WHITE,
  colorStartB = LJS.WHITE,
  colorEndA = LJS.CLEAR_WHITE,
  colorEndB = LJS.CLEAR_WHITE,
  particleTime = 2,
  sizeStart = 0.1,
  sizeEnd = 1,
  speed = 0,
  angleSpeed = 0,
  damping = 1,
  angleDamping = 1,
  gravityScale = 0,
  particleConeAngle = LJS.PI,
  fadeRate = 0.5,
  randomness = 0,
  collideTiles = false,
  additive = false,
  randomColorLinear = true,
  renderOrder = additive ? 1e9 : 0,
  localSpace = false,
  screenSpace = false,
} = {}) =>
  new LJS.ParticleEmitter(
    pos,
    angle,
    emitSize,
    emitTime,
    emitRate,
    emitConeAngle,
    tileInfo,
    colorStartA,
    colorStartB,
    colorEndA,
    colorEndB,
    particleTime,
    sizeStart,
    sizeEnd,
    speed,
    angleSpeed,
    damping,
    angleDamping,
    gravityScale,
    particleConeAngle,
    fadeRate,
    randomness,
    collideTiles,
    additive,
    randomColorLinear,
    renderOrder,
    localSpace
  );

export class MyParticle extends LJS.Particle {
  radius: number;
  spin: number;
  trailRate: number;
  trailTimer!: LJS.Timer;
  trail: MyParticle[] = [];

  /**
   * Overrides default sizing interpolation (ignores sizeStart, sizeEnd and sizeEase)
   * */
  sizeFunc?: (t: number) => number;

  /**
   * Easing for radius transition. Both domain and codomain must be [0,1].
   */
  sizeEase: (t: number) => number;

  /**
   * Easing for color transition. Both domain and codomain must be [0,1].
   */
  colorEase: (t: number) => number;

  screenSpace: boolean;
  name: string;

  constructor(
    pos: LJS.Vector2,
    {
      tileInfo = tile(0, tileSize, 2), // star
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
      additive = false,
      /** @property {number} - If a undefined, how long to make it */
      trailScale = 0,
      /** @property {ParticleEmitter} - Parent emitter if local space */
      localSpaceEmitter = undefined,
      /** @property {ParticleCallbackFunction} - Called when particle dies */
      destroyCallback = undefined,
      velocity = vec2(),
      angleVelocity = 0,
      spin = 0,
      sizeFunc = undefined as ((t: number) => number) | undefined,
      sizeEase = (t: number) => t,
      colorEase = (t: number) => t,
      trailRate = 0,
      screenSpace = false,
      name = "",
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
    this.sizeEase = sizeEase;
    this.colorEase = colorEase;
    this.radius = (sizeFunc && sizeFunc(0)) ?? sizeStart;
    this.screenSpace = screenSpace;
    this.name = name;

    this.trailRate = trailRate;
    if (trailRate) this.trailTimer = new LJS.Timer(this.trailRate);
  }

  update(): void {
    super.update();

    if (this.trailRate && this.trailTimer.elapsed()) {
      new MyParticle(this.pos, {
        angle: this.angle,
        lifeTime: 10,
        tileInfo: this.tileInfo,
        spin: 0,
        colorStart: setAlpha(this.color, 0.5),
        colorEnd: setAlpha(this.color, 0),
        trailRate: 0,
        additive: true,
        sizeStart: this.radius,
        sizeEnd: 0,
        screenSpace: this.screenSpace,
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

    this.radius =
      (this.sizeFunc && this.sizeFunc(t)) ??
      LJS.lerp(this.sizeStart, this.sizeEnd, this.sizeEase(t));
    this.size = vec2(this.radius);
    this.color = this.color.lerp(this.colorEnd, this.colorEase(t));

    // draw the particle
    this.additive && LJS.setBlendMode(true);
    LJS.drawTile(
      this.pos,
      this.size,
      this.tileInfo,
      this.color,
      this.angle,
      this.mirror,
      undefined,
      undefined,
      this.screenSpace
    );
    this.additive && LJS.setBlendMode();
  }
}
