import * as LJS from "littlejsengine";
import { Animation } from "../animation";
import { type BeatCount } from "../beat";
import { globalBeat, spriteAtlas, tileSize } from "../main";
import {
  DEG2RAD,
  formatPolar,
  formatDegrees,
  lerpVec2,
  LOG,
  MyParticle,
  polar2cart,
} from "../mathUtils";
import { sfx } from "../sfx";
const { vec2, rgb } = LJS;

export const swimAccel = vec2(10 * DEG2RAD, 0.1);
export const minRadius = 2;

export class Microbe extends LJS.EngineObject {
  orbitCenter: LJS.Vector2 = vec2();
  direction = 1; // counterclockwise

  animations = {
    swim: new Animation("swim", 10, 1 / 30, 1),
    idle: new Animation("idle", 5, 1 / 12, 0),
    bump: new Animation("bump", 12, 1 / 30, 1),
  };

  currentAnim: keyof typeof this.animations = "idle";
  bubbleEmitter: LJS.ParticleEmitter;

  turnSignal = 0;
  turnPhi;

  get phi() {
    return this.polarPos.x;
  }

  get dist() {
    return this.polarPos.y;
  }

  set phi(v) {
    this.polarPos.x = v;
  }

  set dist(v) {
    this.polarPos.y = v;
  }

  newCenter() {
    if (this.isLeader()) {
      this.orbitCenter = lerpVec2(this.orbitCenter, this.pos, 2);
      this.direction *= -1;
      this.turnPhi = this.phi -= Math.PI;
      this.turnSignal = 0;

      LOG(
        `Changing center of leader at angle turnPhi: ${this.turnPhi} ${this.phi}`
      );
    }
  }

  isLeader() {
    return this.leader === undefined;
  }

  constructor(
    public polarPos: LJS.Vector2,
    public leader?: Microbe,
    public number = 0,
    public beat = globalBeat
  ) {
    super(polar2cart(polarPos));

    this.size = vec2(1.5);
    this.drawSize = vec2(5);
    this.mass = 1;
    this.damping = 0.8;
    // this.angleDamping = 0.89;
    // this.restitution = 2;
    this.color = LJS.randColor();
    this.turnPhi = this.phi;

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

    this.bump(o);

    return false;
  }

  onbeat(_: BeatCount) {}

  updatePhysics(): void {
    super.updatePhysics(); // let the engine update the velocity

    this.polarPos = this.polarPos.add(this.velocity);

    // smooth out radius differences
    this.leader && (this.dist = LJS.lerp(this.dist, this.leader.dist, 0.01));

    this.pos = polar2cart(this.polarPos, this.orbitCenter);
    this.angle = this.phi + this.direction * 90 * DEG2RAD;
  }

  render(): void {
    const name = this.currentAnim;
    const anim = this.animations[name];

    anim.update();
    this.tileInfo = anim.getFrame(spriteAtlas[name]);
    const tummyTileInfo = anim.getFrame(spriteAtlas[`${name}_tummy`]);

    LJS.debugText(formatPolar(this.polarPos), this.pos.add(vec2(0, 1)), 0.5);

    LJS.drawLine(
      this.orbitCenter,
      this.pos,
      0.1,
      this.isLeader() ? LJS.YELLOW : LJS.BLUE
    );
    LJS.drawCircle(this.orbitCenter, 0.5, LJS.RED);
    LJS.drawTile(
      this.pos,
      this.drawSize,
      this.tileInfo,
      undefined,
      this.angle,
      this.mirror
    );

    LJS.drawTile(
      this.pos,
      this.drawSize,
      tummyTileInfo,
      this.color,
      this.angle,
      this.mirror
    );
  }

  bump(other: Microbe) {
    this.playAnim("bump");

    sfx.boo.play(this.pos);

    new MyParticle(this.pos, {
      tileInfo: LJS.tile(5, tileSize, 2),
      lifeTime: 0.2,
      sizeEnd: 3,
    });
  }

  swim() {
    // can't swim during recoil
    // if (this.animations.bump.isPlaying()) return;
    // LOG("swim");

    this.playAnim("swim");

    const volume =
      LJS.cameraPos.subtract(this.pos).length() / LJS.cameraPos.length();

    sfx.bubble3.play(this.pos, 0.2);

    // move forward
    if (this.leader) {
      if (this.leader.turnSignal === this.number + 1) {
        this.orbitCenter = this.leader.orbitCenter;
        this.direction = this.leader.direction;
        this.phi = this.leader.turnPhi;
        // const v1 = this.leader.pos.subtract(this.leader.orbitCenter);
        // const v2 = this.pos.subtract(this.leader.orbitCenter);
        // this.phi = Math.acos(v1.dot(v2) / (v1.length() * v2.length()));
        // this.dist = v2.length();
      }
    } else {
      if (this.dist < minRadius) this.newCenter();
      this.turnSignal++;
    }

    this.applyForce(swimAccel.scale(this.direction));

    this.bubbleEmitter.emitRate = 10;
  }

  idle() {
    // LOG("idle");
    this.bubbleEmitter.emitRate = 0;
    return this.playAnim("idle");
  }

  /** Play an animation by its name.
   * Fails if an animation with higher priority is already playing,
   * in which case this function returns false. */
  private playAnim(desiredAnim: keyof typeof this.animations) {
    const current = this.animations[this.currentAnim];
    const desired = this.animations[desiredAnim];

    if (current.priority > desired.priority && current.isPlaying())
      return false;

    this.currentAnim = desiredAnim;
    desired.play();

    return true;
  }
}
