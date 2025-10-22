import * as LJS from "littlejsengine";
import { spriteAtlas } from "../main";
import { sfx } from "../sfx";
import { Animation } from "../animation";
const { vec2, rgb } = LJS;
const rgba = (r: number, g: number, b: number, a: number | undefined) =>
  rgb(r / 255, g / 255, b / 255, a);

export const tileSize = vec2(100);
export const bpm = 60;

export class Microbe extends LJS.EngineObject {
  animations: Record<"idle" | "swim", Animation>;

  beatTimer = new LJS.Timer(60 / bpm); // swim every second
  currentBeat: number = 0;

  moveInput: LJS.Vector2 = vec2(0, 0);
  angle = 0;
  currentAnim: keyof typeof this.animations = "idle";

  bubbleEmitter: LJS.ParticleEmitter;

  constructor(pos: LJS.Vector2) {
    super(pos);

    this.animations = {
      swim: new Animation("swim", 10, 1 / 30),
      idle: new Animation("idle", 5, 1 / 12),
    };

    this.size = vec2(5);
    this.mass = 0.2;
    this.damping = 0.89;
    this.angleDamping = 0.89;

    this.bubbleEmitter = new LJS.ParticleEmitter(this.pos);
    this.addChild(this.bubbleEmitter);

    this.bubbleEmitter.emitRate = 0;
    this.bubbleEmitter.localPos = vec2(0, -1);
    this.bubbleEmitter.additive = true;
    this.bubbleEmitter.tileInfo = spriteAtlas["bubble"];
    this.bubbleEmitter.emitConeAngle = 30;
    // this.bubbleEmitter.particleDestroyCallback = () => sfx.bubble2.play(this.pos);
  }

  render(): void {
    const anim = this.animations[this.currentAnim];

    anim.update();
    this.tileInfo = anim.frame;

    if (this.beatTimer.elapsed()) {
      this.playAnim("idle");
      this.beatTimer.set(60 / bpm / 2);
    }

    super.render();
  }

  swim() {
    this.playAnim("swim");
    sfx.swim.play(this.pos);

    this.applyForce(vec2(0, 0.1).rotate(this.angle));
    this.bubbleEmitter.emitRate = 10;
  }

  idle() {
    this.playAnim("idle");
  }

  playAnim(name: keyof typeof this.animations) {
    // prioritize swim animation
    if (
      name !== "swim" &&
      this.currentAnim === "swim" &&
      !this.animations.swim.done()
    )
      return;

    this.currentAnim = name;
    this.animations[name].play();
  }
}
