import * as LJS from "littlejsengine";
import { Animation } from "../animation";
import { PatternWrapping, type BeatCount } from "../beat";
import { spriteAtlas, tileSize } from "../main";
import {
  DEG2RAD,
  formatPolar,
  lerpVec2,
  LOG,
  polar2cart,
  rgba,
  setAlpha,
} from "../mathUtils";
import type { Song } from "../music";
import { emitter, MyParticle } from "../particleUtils";
import { sfx } from "../sfx";
const { vec2, rgb } = LJS;

export enum MicrobeAction {
  Idle,
  Swim,
  Turn,
  Ding,
  Wink,
}

export const swimAccel = vec2(10 * DEG2RAD, 0);
export const minRadius = 5;
export const bubbleEmitRate = 12;
export const bubbleColor = rgba(196, 230, 255, 1);

export class Microbe extends LJS.EngineObject {
  orbitCenter: LJS.Vector2 = vec2();
  direction = 1; // counterclockwise

  animations = {
    swim: new Animation("swim", 10, { delta: 1 / 30 }),
    idle: new Animation("idle", 5, { delta: 1 / 12, priority: 1 }),
    bump: new Animation("bump", 12, { delta: 1 / 30 }),
    blink: new Animation("blink", 4, { delta: 1 / 30, priority: 2 }),
  };

  currentAnim: keyof typeof this.animations = "idle";
  bubbleEmitter: LJS.ParticleEmitter;

  turnSignal = 0;
  turnPhi;

  actions: Function[] = [];

  song?: Song;
  wrapping: PatternWrapping;

  name: string;
  leader?: Microbe;
  rowIdx: number;

  bumpTimer: LJS.Timer;

  private readonly bumpCooldown = 0.5;

  constructor(
    public polarPos: LJS.Vector2,
    {
      rowIdx = 0,
      leader = undefined as Microbe | undefined,
      song = undefined as Song | undefined,
      wrapping = PatternWrapping.End,
      startSwim = false,
    } = {}
  ) {
    super(polar2cart(polarPos));

    this.wrapping = wrapping;
    this.leader = leader;
    this.song = song;
    this.rowIdx = rowIdx;
    this.name = `microbe_${rowIdx}`;
    this.size = vec2(1.5);
    this.drawSize = vec2(5);
    this.mass = 1;
    this.damping = 0.8;
    // this.angleDamping = 0.89;
    // this.restitution = 2;
    this.color = LJS.randColor();
    this.turnPhi = this.phi;

    this.actions[MicrobeAction.Idle] = this.actions[MicrobeAction.Ding] =
      this.idle;
    this.actions[MicrobeAction.Swim] = () => {
      this.isLeader() && (this.song!.swimCount += 1);
      this.swim();
    };
    this.actions[MicrobeAction.Wink] = this.wink;
    this.actions[MicrobeAction.Turn] = () => {
      this.newCenter();
      this.swim();
    };

    this.bubbleEmitter = emitter({
      pos: this.pos, //
      tileInfo: spriteAtlas["bubble"],
      emitRate: bubbleEmitRate,
      emitSize: 4,
      particleTime: 1,
      fadeRate: 0,
      colorEndA: setAlpha(bubbleColor, 0.8),
      colorEndB: setAlpha(bubbleColor, 0.8),
      sizeStart: 0.8,
      sizeEnd: 0.9,
      randomness: 0.25,
      additive: true,
      emitConeAngle: 30 * DEG2RAD,
      speed: -0.25,
      damping: 0.89,
    });
    this.bubbleEmitter.localPos = vec2(0, -1);
    this.addChild(this.bubbleEmitter);

    this.setChoreography();

    this.bumpTimer = new LJS.Timer(this.bumpCooldown);
    this.setCollision();

    if (startSwim) {
      this.swim();
      for (let i = 0; i < 20; i++) {
        new MyParticle(this.pos.add(LJS.randVec2(1)), {
          tileInfo: spriteAtlas.bubble,
          colorStart: setAlpha(bubbleColor, 0.8),
          colorEnd: setAlpha(bubbleColor, 0.8),
          sizeStart: LJS.rand(0.4, 0.8),
          sizeEnd: LJS.rand(0.8, 1.6),
          velocity: LJS.randVec2(0.25),
          lifeTime: LJS.rand(0.5, 1),
          damping: 0.89,
          additive: true,
        });
      }
    }
  }

  setChoreography() {
    this.song?.beat.onpattern(
      this.song.choreography,
      (note) => note !== undefined && this.actions.at(note)?.call(this),
      this.wrapping
    );
  }

  collideWithObject(o: LJS.EngineObject): boolean {
    if (!(o instanceof Microbe)) return true;
    if (this.destroyed || o.destroyed) return false;

    if (this.bumpTimer.elapsed()) {
      this.bumpTimer.set(this.bumpCooldown);
    }
    this.bump(o);

    return false;
  }

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

  onbeat(_: BeatCount) {}

  updatePhysics(): void {
    super.updatePhysics(); // let the engine update the velocity

    this.polarPos = this.polarPos.add(this.velocity);

    // smooth out radius differences
    if (this.leader) this.dist = LJS.lerp(this.dist, this.leader.dist, 0.01);
    this.dist = LJS.max(minRadius, this.dist);

    this.pos = polar2cart(this.polarPos, this.orbitCenter);
    this.angle = this.phi + this.direction * 90 * DEG2RAD;

    this.bubbleEmitter.emitRate =
      this.velocity.length() > 0.01 ? bubbleEmitRate : 0;
  }

  debug() {
    LJS.debugText(formatPolar(this.polarPos), this.pos.add(vec2(0, 1)), 0.5);

    LJS.debugLine(
      this.orbitCenter,
      this.pos,
      this.isLeader() ? LJS.YELLOW : LJS.BLUE,
      0.1
    );
    LJS.debugCircle(this.orbitCenter, 0.5, LJS.RED);
  }

  render(): void {
    const name = this.currentAnim;
    const anim = this.animations[name];

    anim.update();
    this.tileInfo = anim.getFrame(spriteAtlas[name]);
    const tummyTileInfo = anim.getFrame(spriteAtlas[`${name}_tummy`]);

    // this.debug();

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

  wink() {
    this.playAnim("blink");
  }

  bump(other: Microbe) {
    // LOG(`${this.name} ${this.pos} bumped with ${other.name} ${other.pos}`);

    this.playAnim("bump");

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
      if (this.leader.turnSignal === this.rowIdx + 1) {
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
  }

  idle() {
    // LOG("idle");
    this.bubbleEmitter.emitRate = 0;
    return this.playAnim("idle");
  }

  /** Play an animation by its name.
   * Plays nothing if an animation with higher priority is already playing,
   * in which case this function returns false. */
  private playAnim(desiredAnim: keyof typeof this.animations) {
    const current = this.animations[this.currentAnim];
    const desired = this.animations[desiredAnim];

    if (current.priority < desired.priority && current.isPlaying())
      return false;

    this.currentAnim = desiredAnim;
    desired.play();

    return true;
  }
}
