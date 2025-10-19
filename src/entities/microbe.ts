import * as LJS from "littlejsengine";
import { spriteAtlas } from "../main";
import { sfx } from "../sfx";
const { vec2, rgb } = LJS;
const rgba = (r: number, g: number, b: number, a: number | undefined) =>
  rgb(r / 255, g / 255, b / 255, a);

export const tileSize = vec2(100);

export const animations = {
  swim: { duration: 10, loop: false, delta: 1 / 30 },
  idle: { duration: 5, loop: true, delta: 1 / 12 },
};

export class Microbe extends LJS.EngineObject {
  moveInput: LJS.Vector2 = vec2(0, 0);
  angle = 0;
  animationFrame = 0;
  animationTimer = new LJS.Timer();
  animationName: keyof typeof animations = "idle";

  bubbleEmitter: LJS.ParticleEmitter;

  constructor(pos: LJS.Vector2) {
    super(pos);

    this.size = vec2(5);
    this.mass = 0.2;
    this.damping = 0.89;
    this.angleDamping = 0.89;

    this.bubbleEmitter = new LJS.ParticleEmitter(this.pos);
    this.addChild(this.bubbleEmitter);

    this.animationTimer.set(animations[this.animationName].delta);

    this.bubbleEmitter.emitRate = 0;
    this.bubbleEmitter.localPos = vec2(0, -1);
    this.bubbleEmitter.additive = true;
    this.bubbleEmitter.tileInfo = spriteAtlas["bubble"];
    // this.bubbleEmitter.particleCreateCallback = () => sfx.bubble2.play();
    this.bubbleEmitter.particleDestroyCallback = () => sfx.bubble2.play();
    this.bubbleEmitter.emitConeAngle = 30;
    // this.bubbleEmitter.colorStartA =
    //   this.bubbleEmitter.colorStartB =
    //   this.bubbleEmitter.colorEndA =
    //   this.bubbleEmitter.colorEndB =
    //     rgba(167, 214, 255, 0.5); // rgba(167, 214, 255, 1)
    // this.bubbleEmitter.emitTime = 1;
  }

  render(): void {
    // update animation
    this.tileInfo = spriteAtlas[this.animationName].frame(this.animationFrame);
    const { duration, loop, delta } = animations[this.animationName];

    if (this.animationTimer.elapsed()) {
      this.animationFrame++;
      if (loop) this.animationFrame %= duration;
      this.animationTimer.set(delta);
    }

    if (this.animationFrame >= duration) {
      this.bubbleEmitter.emitRate = 0;
      this.animationName = "idle";
    }

    super.render();
  }

  swim() {
    this.animationName = "swim";
    this.animationFrame = 0;
    this.applyForce(vec2(0, 0.1).rotate(this.angle));

    sfx.swim.play();

    this.bubbleEmitter.emitRate = 10;
  }

  idle() {
    this.animationName = "idle";
    this.animationFrame = 0;
  }
}
