import * as LJS from "littlejsengine";
import { spriteAtlas } from "../main";
import { sfx } from "../sfx";
const { vec2, rgb } = LJS;
const rgba = (r: number, g: number, b: number, a: number | undefined) =>
  rgb(r / 255, g / 255, b / 255, a);

export const tileSize = vec2(100);

export class Microbe extends LJS.EngineObject {
  moveInput: LJS.Vector2 = vec2(0, 0);
  angle = 0;
  animationFrame = 0;
  animationDelta = 1 / 30;
  animationDuration = 10; // frames
  animationTimer = new LJS.Timer(this.animationDelta);

  bubbleEmitter: LJS.ParticleEmitter;

  constructor(pos: LJS.Vector2) {
    super(pos);

    this.size = vec2(5);
    this.mass = 0.2;
    this.damping = 0.89;
    this.angleDamping = 0.89;

    this.bubbleEmitter = new LJS.ParticleEmitter(this.pos);
    this.addChild(this.bubbleEmitter);

    this.bubbleEmitter.emitRate = 0;
    this.bubbleEmitter.localPos = vec2(0, -1);
    this.bubbleEmitter.additive = true;
    // this.bubbleEmitter.particleCreateCallback = () => sfx.bubble2.play();
    this.bubbleEmitter.particleDestroyCallback = () => sfx.bubble2.play();
    this.bubbleEmitter.colorStartA =
      this.bubbleEmitter.colorStartB =
      this.bubbleEmitter.colorEndA =
      this.bubbleEmitter.colorEndB =
        rgba(167, 214, 255, 0.5); // rgba(167, 214, 255, 1)
    // this.bubbleEmitter.emitTime = 1;
  }

  render(): void {
    // update animation
    this.tileInfo = spriteAtlas["swim"].frame(this.animationFrame);

    if (
      this.animationTimer.elapsed() &&
      this.animationFrame < this.animationDuration
    ) {
      this.animationFrame++;
      this.animationTimer.set(this.animationDelta);
    }

    if (this.animationFrame >= this.animationDuration) {
      this.bubbleEmitter.emitRate = 0;
    }

    super.render();
  }

  swim() {
    this.animationFrame = 0;
    this.applyForce(vec2(0, 0.1).rotate(this.angle));

    sfx.swim.play();

    this.bubbleEmitter.emitRate = 10;
  }
}
