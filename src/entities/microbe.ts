import * as LJS from "littlejsengine";
import { Animation } from "../animation";
import { Beat, type BeatCount } from "../beat";
import { spriteAtlas } from "../main";
import { sfx } from "../sfx";
const { vec2, rgb } = LJS;

export class Microbe extends LJS.EngineObject {
  animations: Record<"idle" | "swim" | "bump", Animation>;
  beat = new Beat(60, 4, 2);

  moveInput: LJS.Vector2 = vec2(0, 0);
  angle = 0;
  currentAnim: keyof typeof this.animations = "idle";

  bubbleEmitter: LJS.ParticleEmitter;

  constructor(pos: LJS.Vector2) {
    super(pos);

    this.animations = {
      swim: new Animation("swim", 10, 1 / 30, 1),
      idle: new Animation("idle", 5, 1 / 12, 0),
      bump: new Animation("bump", 14, 1 / 30, 2),
    };

    this.size = vec2(2);
    this.drawSize = vec2(5);
    this.mass = 0.2;
    this.damping = 0.89;
    this.angleDamping = 0.89;
    this.restitution = 5;

    this.bubbleEmitter = new LJS.ParticleEmitter(this.pos);
    this.addChild(this.bubbleEmitter);

    this.bubbleEmitter.emitRate = 0;
    this.bubbleEmitter.localPos = vec2(0, -1);
    this.bubbleEmitter.additive = true;
    this.bubbleEmitter.tileInfo = spriteAtlas["bubble"];
    this.bubbleEmitter.emitConeAngle = 30;
    // this.bubbleEmitter.particleDestroyCallback = () => sfx.bubble2.play(this.pos);

    this.beat.onbeat(this.onbeat.bind(this));

    this.setCollision();
  }

  collideWithObject(o: LJS.EngineObject): boolean {
    if (!(o instanceof Microbe)) return true;

    sfx.boo.play(this.pos);
    this.playAnim("bump");

    return true;
  }

  onbeat(_b: BeatCount) {
    this.idle();
  }

  update(): void {
    super.update();

    const anim = this.animations[this.currentAnim];

    anim.update();
    this.tileInfo = anim.frame;

    this.beat.update();
  }

  swim() {
    this.playAnim("swim");

    const volume =
      LJS.cameraPos.subtract(this.pos).length() / LJS.cameraPos.length();

    sfx.bubble3.play(this.pos, 0.2);

    this.applyForce(vec2(0, 0.1).rotate(this.angle));
    this.bubbleEmitter.emitRate = 10;
  }

  idle() {
    this.playAnim("idle");
    this.bubbleEmitter.emitRate = 0;
  }

  private playAnim(desiredAnim: keyof typeof this.animations) {
    // exit early if higher priority is playing
    const current = this.animations[this.currentAnim];
    const desired = this.animations[desiredAnim];

    if (current.priority > desired.priority && !this.animations.bump.done())
      return;

    this.currentAnim = desiredAnim;
    desired.play();
  }
}
